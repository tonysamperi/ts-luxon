import {Component} from "@angular/core";
import {Title} from "@angular/platform-browser";
import {DateTime, Duration} from "ts-luxon";

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
    docsLink: string = "./docs";
    examples: { code: string; subtitle: string; title: string; value: string; }[] = [
        {
            code: `import {{ DateTime } from "ts-luxon";

DateTime.local()
    .setZone("America/New_York")
    .minus({{ weeks: 1 })
    .endOf("day")
    .toISO();`,
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

DateTime.local(2017, 5, 15, 8, 30).toLocaleString();`,
            title: "Specific DateTime from config",
            subtitle: "Local date at specific date and time",
            value: DateTime.local(2017, 5, 15, 8, 30).toLocaleString()
        },
        {
            code: `import {{ DateTime } from "ts-luxon";

DateTime.local().diff(DateTime.local().minus({
    day: 5,
    hour: 3,
    minute: 27
})).toHuman({onlyHumanUnits: !0})
`,
            title: "Duration toHuman",
            subtitle: "Print human readable durations",
            value: DateTime.local().diff(DateTime.local().minus({
                day: 5,
                hour: 3,
                minute: 27
            })).toHuman({onlyHumanUnits: !0})
        },
        {
            code: `import {{ DateTime } from "ts-luxon";

DateTime.local().locale;`,
            title: "Get system locale",
            subtitle: "Check your locale",
            value: DateTime.local().locale
        },
        {
            code: `import {{ DateTime } from "ts-luxon";

DateTime.local().plus({years: 1, days: 1}).toLocaleString();`,
            title: "Add periods to a DateTime",
            subtitle: "Can also subtract with `minus`",
            value: DateTime.local().plus({years: 1, days: 1}).toLocaleString()
        }
    ];
    githubLink: string = "https://github.com/tonysamperi/ts-luxon";
    selectedTheme: LuxTheme;
    themes: LuxTheme[] = [
        {value: "", description: "Light"},
        {value: "dark-theme", description: "Dark"}
    ];
    unpkgLink: string = "https://unpkg.com/ts-luxon@latest/dist/ts-luxon.umd.js";
    year: number = DateTime.now().year;

    constructor(titleService: Title) {
        this.selectedTheme = this.themes[0];
        titleService.setTitle(this.appName);
        this._foo();
    }

    updateTheme(theme: LuxTheme): void {
        this.selectedTheme = theme;
        document.body.classList.toggle("dark-theme", !!theme.value);
    }

    // Helper fn to try code before writing a new code block
    private _foo(): void {

    }

}
