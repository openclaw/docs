---
read_when:
    - Перевірка завантажень на зловживання або порушення політик
    - Написання документації з модерації або робочих інструкцій для рецензентів
    - Визначення, чи слід приховати skill або забанити користувача
sidebarTitle: Acceptable Usage
summary: 'Політика marketplace: що ClawHub дозволяє і що він не розміщуватиме.'
title: Прийнятне використання
x-i18n:
    generated_at: "2026-06-30T14:22:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Прийнятне використання

ClawHub розміщує skills, plugins, packages і метадані marketplace для OpenClaw.
Скористайтеся цією сторінкою, щоб вирішити, чи належить вміст або поведінка публікації до
ClawHub.

Ці правила застосовуються до того, що робить listing, що він просить користувачів запускати, як він
представляє себе, і як publishers використовують discovery, install і
trust surfaces ClawHub. Для станів модерації та статусу облікового запису див.
[Модерація та безпека облікового запису](/clawhub/moderation). Для заяв про copyright або інші права
див. [Запити щодо прав на вміст](/clawhub/content-rights).

## Дозволений вміст

ClawHub вітає вміст, який є корисним, зрозумілим і опублікованим добросовісно.

| Категорія                                         | Дозволено, коли                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Продуктивність розробника                           | Listing допомагає користувачам створювати, тестувати, мігрувати, налагоджувати, документувати або експлуатувати програмне забезпечення.                                               |
| UI, дані та автоматизаційні workflow               | Scope чіткий, потрібні credentials явно вказані, а ризиковані дії мають шляхи review, dry-run, preview або confirmation. |
| Захисна безпека, модерація та перевірка зловживань | Tool подано як засіб для authorized review, він зберігає evidence і чітко визначає межі human approval.                          |
| Особисті або командні workflow                       | Workflow використовує облікові записи на основі згоди, прозоре налаштування та явні дозволи.                                            |
| Підтримувані каталоги                              | Кожен listing є окремим, корисним, точно описаним і належно підтримуваним.                                                |

Контекст має значення. Та сама тема може бути прийнятною у вузькому захисному або
заснованому на згоді середовищі й неприйнятною, коли її упаковано як workflow для зловживань.

## Заборонений вміст

ClawHub не розміщує вміст, головною метою якого є зловживання, обман, небезпечне
виконання або порушення прав.

| Категорія                                                    | Заборонено                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Несанкціонований доступ або обхід безпеки                      | Обхід auth, захоплення облікового запису, зловживання rate-limit, захоплення live call або agent, повторно використовувана крадіжка session, або auto-approving pairing flows для несхвалених користувачів.                                                                                                                                                   |
| Зловживання платформою та обхід заборон                              | Stealth accounts після заборон, warming або farming облікових записів, фальшива engagement, автоматизація кількох облікових записів, масове posting, spam bots або автоматизація, створена для уникнення виявлення.                                                                                                                                          |
| Шахрайство, scams і оманливі фінансові workflow             | Фальшиві сертифікати або invoices, оманливі payment flows, scam outreach, фальшивий social proof, synthetic-identity workflows для шахрайства або інструменти spending/charging без чіткого human approval.                                                                                                                    |
| Privacy-invasive enrichment або surveillance                 | Збирання контактів для spam, doxxing, stalking, lead extraction у поєднанні з unsolicited outreach, covert monitoring, non-consensual biometric matching або використання leaked data чи breach dumps.                                                                                                                  |
| Non-consensual impersonation або manipulation of identity       | Face swap, digital twins, cloned influencers, fake personas або інші інструменти, що використовуються для impersonation чи введення в оману.                                                                                                                                                                                                 |
| Explicit sexual content або safety-disabled adult generation | Генерація NSFW зображень, відео або вмісту; wrappers для adult-content навколо third-party APIs; або listings, основною метою яких є explicit sexual content.                                                                                                                                                       |
| Приховані, небезпечні або оманливі вимоги до виконання        | Обфусковані install commands, pipe-to-shell installers, наприклад завантажений вміст, що запускається через `sh` або `bash` без чіткої reviewability, незаявлені вимоги до secret або private-key, віддалене виконання `npx @latest` без чіткої reviewability або metadata, що приховує, що listing насправді потрібно для запуску. |
| Матеріал, що порушує copyright або rights           | Повторна публікація чужого skill, plugin, docs, brand assets або proprietary code без дозволу; порушення license terms; або impersonation оригінального автора чи publisher.                                                                                                                            |

## Заборонена поведінка marketplace

ClawHub також перевіряє, як publishers використовують marketplace. Не використовуйте ClawHub для
маніпулювання discovery, metrics, trust signals, moderation systems або увагою
користувачів.

Заборонена поведінка marketplace включає:

- bulk publishing великої кількості низькоякісних, дублювальних, placeholder або
  machine-generated listings, які, схоже, не мають реальної користі для користувачів
- flooding search або category surfaces майже ідентичними skills чи plugins
- публікацію сотень listings із малою або відсутньою usage, maintenance, source
  clarity чи meaningful differentiation
- штучне inflating installs, downloads, stars або інших engagement
  metrics через automation, self-install loops, fake accounts, coordinated
  activity, paid engagement або іншу non-organic behavior
- створення або ротацію облікових записів для обходу moderation, bans, publisher limits або
  marketplace review
- введення користувачів в оману щодо ownership, source, capabilities, security posture,
  install requirements або affiliation з іншим project чи publisher
- повторне завантаження content, який уже було hidden, removed або blocked,
  без виправлення underlying issue

Великообсягова публікація не є автоматично зловживанням. Великі каталоги прийнятні,
коли listings суттєво відрізняються, точно описані, підтримуються
і використовуються реальними користувачами. Великі каталоги стають проблемою trust and safety, коли
volume поєднується з поверховими, дублювальними, оманливими, непідтримуваними або
штучно просуваними listings.

## Права на вміст

Якщо ви вважаєте, що content на ClawHub порушує ваш copyright або інші права, використовуйте
[Запити щодо прав на вміст](/clawhub/content-rights). Не використовуйте звичайні reports marketplace
для заяв про copyright або права, якщо listing також не є unsafe,
malicious або misleading.

## Перевірка та застосування правил

ClawHub може використовувати automated checks, statistical abuse signals, user reports і
staff review для виявлення unsafe content або abusive publishing behavior. Signal
сам по собі не доводить abuse; він допомагає ClawHub вирішити, що потребує review.

Ми можемо:

- приховати, утримати, видалити, soft-delete або, де це підтримується для типу resource,
  hard-delete listings, що порушують правила
- заблокувати downloads або installs для unsafe releases
- відкликати API tokens
- soft-delete пов’язаний content
- обмежити publishing access
- забанити repeat або severe offenders

Ми не гарантуємо warning-first enforcement для очевидних зловживань. Див.
[Модерація та безпека облікового запису](/clawhub/moderation) щодо reports, moderation holds,
hidden listings, bans і account standing.
