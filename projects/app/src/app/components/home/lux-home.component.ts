import {Component} from "@angular/core";
import {DateTime} from "ts-luxon";
import {Title} from "@angular/platform-browser";

interface LuxTheme {
    description: string;
    value: string;
}

@Component({
    selector: "lux-home",
    templateUrl: "lux-home.component.html",
    styleUrls: ["lux-home.component.scss"]
})
export class LuxHomeComponent {

    appName: string = "ts-luxon";
    examples: { code: string; subtitle: string; title: string; value: string; }[] = [
        {
            code: `import {{ DateTime } from "ts-luxon";

DateTime.local().setZone('America/New_York').minus({{ weeks: 1 }).endOf('day').toISO();`,
            title: "Datetime ISO custom timezone",
            subtitle: "Timezone for New York, set 1 week ago, end of day",
            value: DateTime.local().setZone("America/New_York").minus({weeks: 1}).endOf("day").toISO()
        },
        {
            code: `import {{ DateTime } from "ts-luxon";

DateTime.local().toFormat("DD/MM/YYYY @ HH:mm");`,
            title: "Datetime custom format",
            subtitle: "DateTime with default timezone",
            value: DateTime.local().toFormat("dd/MM/yyyy @ HH:mm")
        },
        {
            code: `import {{ DateTime } from "ts-luxon";

DateTime.local().setZone('America/New_York').minus({{ weeks: 1 }).endOf('day').toISO();`,
            title: "Datetime ISO custom timezone",
            subtitle: "Timezone for New York, set 1 week ago, end of day",
            value: DateTime.local().setZone("America/New_York").minus({weeks: 1}).endOf("day").toISO()
        },
        {
            code: `import {{ DateTime } from "ts-luxon";

DateTime.local().toFormat("DD/MM/YYYY @ HH:mm");`,
            title: "Datetime custom format",
            subtitle: "DateTime with default timezone",
            value: DateTime.local().toFormat("dd/MM/yyyy @ HH:mm")
        }
    ];
    githubLink: string = "https://github.com/tonysamperi/ts-luxon";
    selectedTheme: LuxTheme;
    themes: LuxTheme[] = [
        {value: "", description: "Light"},
        {value: "dark-theme", description: "Dark"}
    ];
    unpkgLink: string = "https://unpkg.com/ts-luxon@latest/dist/ts-luxon.umd.js";

    constructor(titleService: Title) {
        this.selectedTheme = this.themes[0];
        titleService.setTitle(this.appName);
    }

    updateTheme(theme: LuxTheme): void {
        this.selectedTheme = theme;
        document.body.classList.toggle("dark-theme", !!theme.value);
    }

}
