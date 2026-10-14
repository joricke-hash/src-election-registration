# SRC election registration automation

A Google Apps Script that runs the registration step of a gated, anonymous online student election. Students email a dedicated inbox to register. The script logs each new sender to a Google Sheet, skips duplicates, and sends an automatic confirmation. The finished list is then imported into [TapVoter](https://tapvoter.com), which issues each registered student a one-time voting key.

It was used for a Student Representative Council (SRC) election at a public TVET college campus in South Africa in September 2026.

## The problem

The previous election was counted by hand, had no audit trail, and nothing stopped a student from voting more than once on the same device. The college had no student Google Workspace accounts, so domain-restricted Google Forms were not an option.

## Design decisions

- **Gate on a registered email, not a device.** Students at the college often share phones and lab computers. Locking votes to a device would have blocked legitimate voters or still allowed repeat votes.
- **Build only the missing piece.** TapVoter has no API, so it cannot issue a voting key the moment a student emails in. Rather than build a voting system, the script automates the list-building step and an off-the-shelf platform (USD 4.99 for one month) handles keys, anonymity and the audit log.
- **No server, no hosting.** The script runs inside the Sheet, on a time-driven trigger, under the account that owns the inbox.
- **Idempotent by design.** Processed threads get a Gmail label, so a thread is never logged or answered twice, even if a run overlaps.

## How it works

```
Student emails inbox  ──►  Trigger runs every 5–10 min  ──►  New sender?  ──►  Log to Sheet + auto-reply
(subject: "SRC Vote             (checkForNewRegistrations)          │
 Registration")                                                     └─ Already logged? ──► skip
                                                                    Thread labelled as processed either way

Registration closes  ──►  Download Sheet as CSV  ──►  Import to TapVoter  ──►  One-time voting key per student
```

## Setup

1. Create a Google Sheet under the account that owns the registration inbox.
2. Open **Extensions > Apps Script**, delete the starter code and paste in [`src/Code.gs`](src/Code.gs).
3. Edit `CONFIG` if you need a different subject line, label or reply text.
4. Run `setup` once and approve the Gmail and Sheets permissions. Google shows an "unverified app" warning for your own scripts; choose **Advanced > Go to (project name)**.
5. Add a trigger: function `checkForNewRegistrations`, time-driven, minutes timer, every 5 or 10 minutes.
6. Tell students which address to email and the exact subject line to use.

## Results

- 156 students registered in a window of just over 24 hours.
- 101 voted (65%) during an 11-hour voting window.
- No disputes about the result. The voting platform kept a public transparency log while votes stayed anonymous.

## Known limits and next steps

See [`docs/handover.md`](docs/handover.md) for maintenance notes. In short:

- The CSV download and upload between the Sheet and TapVoter is still manual.
- Two students could not complete the email step and were added by hand.
- Each run processes up to 50 threads. Larger runs carry over to the next trigger, which is fine for a campus but worth knowing for bigger elections.
- The reply goes to whatever address the email came from. There is no check that the sender is actually a student; eligibility was enforced by who received the call to register.

## How this was built

I specified the workflow and constraints, and Claude (Anthropic) wrote the script to that specification. I deployed it, configured the trigger, tested the full flow end to end with my own address before launch, and ran the election.
