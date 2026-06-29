---
read_when:
    - การตรวจสอบการอัปโหลดเพื่อหาการใช้งานในทางที่ผิดหรือการละเมิดนโยบาย
    - การเขียนเอกสารการดูแลเนื้อหาหรือคู่มือปฏิบัติงานสำหรับผู้รีวิว
    - การตัดสินใจว่าควรซ่อน Skill หรือแบนผู้ใช้หรือไม่
sidebarTitle: Acceptable Usage
summary: 'นโยบายมาร์เก็ตเพลส: สิ่งที่ ClawHub อนุญาตและสิ่งที่จะไม่โฮสต์.'
title: การใช้งานที่ยอมรับได้
x-i18n:
    generated_at: "2026-06-28T22:32:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# การใช้งานที่ยอมรับได้

ClawHub โฮสต์ Skills, Plugin, แพ็กเกจ และเมทาดาทาของตลาดกลางสำหรับ OpenClaw
ใช้หน้านี้เพื่อตัดสินว่าเนื้อหาหรือพฤติกรรมการเผยแพร่ควรอยู่บน
ClawHub หรือไม่

These rules apply to what a listing does, what it asks users to run, how it
represents itself, and how publishers use ClawHub's discovery, install, and
trust surfaces. For moderation states and account standing, see
[Moderation and Account Safety](/th/clawhub/moderation). For copyright or other rights
claims, see [Content Rights Requests](/th/clawhub/content-rights).

## Allowed content

ClawHub welcomes content that is useful, understandable, and published in good
faith.

| Category                                         | Allowed when                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Developer productivity                           | The listing helps users build, test, migrate, debug, document, or operate software.                                               |
| UI, data, and automation workflows               | The scope is clear, required credentials are explicit, and risky actions include review, dry-run, preview, or confirmation paths. |
| Defensive security, moderation, and abuse review | The tool is framed for authorized review, preserves evidence, and keeps human approval boundaries clear.                          |
| Personal or team workflows                       | The workflow uses consent-based accounts, transparent setup, and explicit permissions.                                            |
| Maintained catalogs                              | Each listing is distinct, useful, accurately described, and reasonably maintained.                                                |

Context matters. The same topic can be acceptable in a narrow defensive or
consent-based setting and unacceptable when packaged as an abuse workflow.

## Disallowed content

ClawHub does not host content whose main purpose is abuse, deception, unsafe
execution, or rights infringement.

| Category                                                    | Not allowed                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unauthorized access or security bypass                      | Auth bypass, account takeover, rate-limit abuse, live call or agent takeover, reusable session theft, or auto-approving pairing flows for unapproved users.                                                                                                                                                   |
| Platform abuse and ban evasion                              | Stealth accounts after bans, account warming or farming, fake engagement, multi-account automation, mass posting, spam bots, or automation built to avoid detection.                                                                                                                                          |
| Fraud, scams, and deceptive financial workflows             | Fake certificates or invoices, deceptive payment flows, scam outreach, fake social proof, synthetic-identity workflows for fraud, or spending/charging tools without clear human approval.                                                                                                                    |
| Privacy-invasive enrichment or surveillance                 | Contact scraping for spam, doxxing, stalking, lead extraction paired with unsolicited outreach, covert monitoring, non-consensual biometric matching, or use of leaked data or breach dumps.                                                                                                                  |
| Non-consensual impersonation or identity manipulation       | Face swap, digital twins, cloned influencers, fake personas, or other tooling used to impersonate or mislead.                                                                                                                                                                                                 |
| Explicit sexual content or safety-disabled adult generation | NSFW image, video, or content generation; adult-content wrappers around third-party APIs; or listings whose primary purpose is explicit sexual content.                                                                                                                                                       |
| Hidden, unsafe, or misleading execution requirements        | Obfuscated install commands, pipe-to-shell installers such as downloaded content run with `sh` or `bash` without clear reviewability, undeclared secret or private-key requirements, remote `npx @latest` execution without clear reviewability, or metadata that hides what the listing really needs to run. |
| Copyright-infringing or rights-violating material           | Republishing someone else's skill, plugin, docs, brand assets, or proprietary code without permission; violating license terms; or impersonating the original author or publisher.                                                                                                                            |

## Disallowed marketplace behavior

ClawHub also reviews how publishers use the marketplace. Do not use ClawHub to
manipulate discovery, metrics, trust signals, moderation systems, or user
attention.

Disallowed marketplace behavior includes:

- bulk publishing large numbers of low-effort, duplicative, placeholder, or
  machine-generated listings that do not appear to have real user value
- flooding search or category surfaces with near-identical skills or plugins
- publishing hundreds of listings with little or no usage, maintenance, source
  clarity, or meaningful differentiation
- artificially inflating installs, downloads, stars, or other engagement
  metrics through automation, self-install loops, fake accounts, coordinated
  activity, paid engagement, or other non-organic behavior
- creating or rotating accounts to evade moderation, bans, publisher limits, or
  marketplace review
- misleading users about ownership, source, capabilities, security posture,
  install requirements, or affiliation with another project or publisher
- repeatedly uploading content that has already been hidden, removed, or blocked
  without fixing the underlying issue

High-volume publishing is not automatically abuse. Large catalogs are acceptable
when the listings are meaningfully different, accurately described, maintained,
and used by real users. Large catalogs become a trust and safety problem when
volume is paired with thin, duplicative, misleading, unmaintained, or
artificially promoted listings.

## Content rights

If you believe content on ClawHub infringes your copyright or other rights, use
[Content Rights Requests](/th/clawhub/content-rights). Do not use normal marketplace
reports for copyright or rights claims unless the listing is also unsafe,
malicious, or misleading.

## Review and enforcement

ClawHub may use automated checks, statistical abuse signals, user reports, and
staff review to identify unsafe content or abusive publishing behavior. A signal
does not prove abuse by itself; it helps ClawHub decide what needs review.

We may:

- hide, hold, remove, soft-delete, or, where supported for the resource type,
  hard-delete violating listings
- block downloads or installs for unsafe releases
- revoke API tokens
- soft-delete associated content
- restrict publishing access
- ban repeat or severe offenders

We do not guarantee warning-first enforcement for obvious abuse. See
[Moderation and Account Safety](/th/clawhub/moderation) for reports, moderation holds,
hidden listings, bans, and account standing.
