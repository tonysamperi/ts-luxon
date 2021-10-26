# Why does TSLuxon exist?

I liked Luxon and the fact it was light and immutable, but unfortunately at the time (v 1.25.0) it had structural issues which resulted in errors in my Typescript projects (I like Angular very much).

So starting by a branch created by [GillesDebunne]([initial-autor]), I improved the Typescript coding and sync'd (and actually I refactored a lot of things, which IMHO could be written in a better way, whithout altering the functionalities of course) every commit from the original Luxon repo.

Note that a UMD bundle is part of the build, so **you can use TSLuxon even in your Javascript projects**!

The idea is keeping the repos in sinc and at this time (October 2021) I just published v 3.0.0 which is perfectly aligned with Luxon 2.0.1.
Unfortunately version numbers cannot match, because of how the repos started and because the frequency of the updates is not the same, so it's likely that TSLuxon gets updates with a 15-30 days of delay, because I'm maintaining this code alone.
So **please if you want to contribute you can absolutely create PRs!**.

[initial-author]: https://github.com/GillesDebunne
