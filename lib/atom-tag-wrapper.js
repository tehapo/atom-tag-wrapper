'use babel';

import { CompositeDisposable } from 'atom';

export default {

  subscriptions: null,
  tag: 'p',

  activate() {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-tag-wrapper:wrap': () => this.wrapSelections()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  wrapSelection(editor, selectionRange) {
    let selectedText = editor.getTextInBufferRange(selectionRange);
    const multipleLines = selectionRange.start.row !== selectionRange.end.row;
    const endsWithLineBreak = selectedText.endsWith('\n');

    let tabText = '';
    let indentLevelSelection = 0;
    let indentLevelRow = 0;
    if (multipleLines) {
      tabText = editor.getTabText();
      indentLevelSelection = editor.indentLevelForLine(selectedText);
      indentLevelRow = editor.indentationForBufferRow(selectionRange.start.row);

      // Indent one level deeper.
      // TODO Find out if there is an API for doing this.
      selectedText = `${tabText.repeat(indentLevelRow + 1)}${selectedText.trim().replace(/\n/g, `\n${tabText}`)}`;
    }

    // Create the new text and insert into editor.
    let newText  = tabText.repeat(indentLevelSelection);
        newText += `<${this.tag}>`;
        newText += (multipleLines ? '\n' : '');
        newText += selectedText;
        newText += (multipleLines ? '\n' : '');
        newText += tabText.repeat(indentLevelRow);
        newText += `</${this.tag}>`;
        newText += (endsWithLineBreak ? '\n' : '');
    return editor.setTextInBufferRange(selectionRange, newText);
  },

  getInsertedTagRanges(editor, insertRange) {
    const tagRanges = [];
    const tagRegExp = new RegExp(this.tag);
    const matchCallback = (match) => {
      tagRanges.push(match.range);
      match.stop();
    };

    // Scan for opening and ending tag.
    editor.scanInBufferRange(tagRegExp, insertRange, matchCallback);
    editor.backwardsScanInBufferRange(tagRegExp, insertRange, matchCallback);

    return tagRanges;
  },

  wrapSelections() {
    const editor = atom.workspace.getActiveTextEditor();
    if (editor) {
      const tagRanges = [];

      // Wrap all selections with the tag and store ranges of
      // inserted tags into tagRanges array.
      editor.mutateSelectedText((selection) => {
        const insertRange = this.wrapSelection(editor, selection.getBufferRange());
        tagRanges.push(...this.getInsertedTagRanges(editor, insertRange));
      });

      // Select all inserted tags.
      editor.setSelectedBufferRanges(tagRanges);
    }
  }

};
