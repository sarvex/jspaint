/*
first i did this:

 2020-12-06 20:08:31 ⌚  ironsmith in ~/Projects/jspaint/localization/ko
± |localization ↑1 {5} ?:1 ✗| → find -name '*.rc' -exec cat {} \; > combined.rc

 2020-12-06 20:08:54 ⌚  ironsmith in ~/Projects/jspaint/localization/ko
± |localization ↑1 {5} ?:1 ✗| → cd ../en

 2020-12-06 20:16:51 ⌚  ironsmith in ~/Projects/jspaint/localization/en
± |localization ↑2 {5} ?:2 ✗| → find -name '*.rc' -exec cat {} \; > combined.rc

and removed U+FEFF ZERO WIDTH NO-BREAK SPACE that seemed to get introduced between files
could do this in Node.js but whatever
*/

const fs = require("fs");
const parse_rc_file = require("./parse-rc-file");
const base_lang = "en";
const remove_hotkey = str => str.replace(/&(\w)/, "$1").replace(/\s?\(.\)/, "");
const remove_ellipsis = str => str.replace("...", "");
const get_strings = (lang)=> {
	const rc_file_text = fs.readFileSync(`${lang}/combined.rc`, "utf16le");
	return parse_rc_file(rc_file_text);
};
const base_strings = get_strings(base_lang);
for (const target_lang of ["ko"]) {
	const target_strings = get_strings(target_lang);
	const localizations = {};
	const add_localizations = (base_strings, target_strings)=> {
		for (let i = 0; i < target_strings.length; i++) {
			const base_string = base_strings[i];
			const target_string = target_strings[i];
			if (base_string !== target_string && base_string && target_string) {
				// Split strings like "&Attributes...\tCtrl+E"
				if (base_string.match(/\t/)) {
					add_localizations(
						base_string.split(/\t/),
						target_string.split(/\t/)
					);
				} else {
					if (localizations[base_string] && localizations[base_string] !== target_string) {
						console.warn(`Collision for '${base_string}' : '${localizations[base_string]}' vs '${target_string}'`);
					}
					localizations[base_string] = target_string;
					// this can cause more collisions @TODO detect
					localizations[remove_hotkey(base_string)] = remove_hotkey(target_string);
					localizations[remove_ellipsis(base_string)] = remove_ellipsis(target_string);
				}
			}
		}
	};
	add_localizations(base_strings, target_strings);
	fs.writeFileSync(`${target_lang}/localizations.json`, JSON.stringify(localizations));
}
