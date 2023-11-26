export class HotKeySettings {
    [propName: string]: HotKey | any;
    previous_shortcut: HotKey = new HotKey('previous', 'Previous', 'left');
    next_shortcut: HotKey = new HotKey('next', 'Skip / Next', 'right');
    select_left_and_next_shortcut: HotKey = new HotKey('select_left_and_next', 'Select Left & Next', 'z');
    select_right_and_next_shortcut: HotKey = new HotKey('select_right_and_next', 'Select Right & Next', 'x');
    select_both_and_next_shortcut: HotKey = new HotKey('select_both_and_next', 'Select Both & Next', 'c');
    select_none_and_next_shortcut: HotKey = new HotKey('select_none_and_next', 'Select None & Next', 'v');
}

export class HotKey{
    constructor(
        public actionKey: string,
        public displayName: string,
        public key: string,
    ){}
}