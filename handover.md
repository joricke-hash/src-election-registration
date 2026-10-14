# Handover and maintenance notes

For whoever runs the next election.

## What it depends on

| Dependency | Notes |
|---|---|
| A Gmail account that owns the registration inbox | The script runs under this account and sends replies from it. Use an account the institution controls, not a personal one, so access survives staff changes. |
| A Google Sheet with the script bound to it | Holds the `Registrations` tab: name, email, timestamp. |
| A time-driven trigger | Function `checkForNewRegistrations`, every 5–10 minutes. Triggers belong to the user who created them. If that person leaves, recreate it. |
| A TapVoter account | One month of TapVoter Pro was used (USD 4.99). It is a monthly subscription: cancel it after the election or decide in advance to keep it. |

## Running it again

1. Clear the `Registrations` tab, keeping the header row, or start a fresh Sheet.
2. Delete or rename the `SRC-Vote-Processed` Gmail label so old threads are not mixed in. Run `setup` again.
3. Re-create the trigger if it was removed after the last election.
4. Send a test registration from your own address and confirm it appears in the Sheet and receives a reply.
5. Announce the address and exact subject line to students.
6. When registration closes, **turn the trigger off**, then download the Sheet as CSV and import it into TapVoter.

## Common problems

- **Nothing appears in the Sheet.** Check the trigger points at `checkForNewRegistrations` (not `setup`) and that the event source is time-driven. Check the student used the exact subject line.
- **Looking at the wrong tab.** Registrations go to the `Registrations` tab, not `Sheet1`.
- **A student cannot email in.** Add them to the Sheet by hand and note it, so the final list stays complete and auditable.
- **"Run setup once" error.** The processed label is missing. Run `setup`.

## Worth automating next

- The CSV handover from the Sheet to TapVoter, if the platform adds an import API, or a different platform is chosen.
- An eligibility check against an official student list before a registration is accepted.
- Closing registration automatically at a set time instead of switching the trigger off by hand.
