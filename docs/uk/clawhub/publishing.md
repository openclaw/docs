---
read_when:
    - Публікація skill або plugin
    - Налагодження помилок області власника або пакета
    - Додавання інтерфейсу публікації, CLI або поведінки бекенду
summary: Як працює публікація в ClawHub для Skills, плагінів, власників, областей дії, випусків і рецензування.
x-i18n:
    generated_at: "2026-06-27T17:17:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Публікація

Публікація надсилає папку Skills або пакет Plugin до ClawHub під вибраним
власником. ClawHub перевіряє, що ваш токен може публікувати від імені цього
власника, перевіряє метадані, назву, версію, файли та інформацію про джерело,
потім зберігає реліз і запускає автоматизовані перевірки безпеки.

Якщо перевірка не проходить, нічого не публікується. Нові релізи також можуть
не з’являтися у звичайних поверхнях встановлення та завантаження, доки не
завершиться огляд.

## Skills

Найпростіший шлях публікації — CLI. Увійдіть, потім опублікуйте локальну папку
Skills:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Використовуйте `--owner <handle>` під час публікації для власника-організації.
Не вказуйте його, щоб публікувати як автентифікований користувач. Публікація
пропускає незмінений вміст. Новий Skills починається з `1.0.0`, а подальші
зміни автоматично публікують наступну patch-версію. Передавайте `--version`
лише тоді, коли потрібна явна версія.

Для репозиторіїв каталогу використовуйте багаторазовий
[workflow `skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
ClawHub. Він викликає `skill publish` для кожної безпосередньої папки Skills
під `root` (за замовчуванням: `skills`) або лише для папки, переданої як
`skill_path`.

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Використовуйте `dry_run: true`, щоб попередньо переглянути нові та змінені
Skills без публікації.

## Plugins

Plugins використовують назви пакетів у стилі npm. Назви scoped-пакетів містять
власника в першій частині назви:

```text
@owner/package-name
```

Scope має відповідати вибраному власнику публікації. Якщо ваш пакет має назву
`@openclaw/dronzer`, його можна опублікувати лише як `@openclaw`. Якщо ви
публікуєте як `@vintageayu`, перейменуйте пакет на `@vintageayu/dronzer`.

Це не дозволяє пакету заявляти namespace організації, який публікатор не
контролює.

Якщо ви є законним власником організації, бренду, scope пакета, handle власника
або namespace, який уже заявлено чи зарезервовано на ClawHub, відкрийте
[issue для заявки на організацію / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
із публічним, неконфіденційним доказом. Див.
[Заявки на організації та namespace](/uk/clawhub/namespace-claims), щоб дізнатися,
що включати, а що не варто додавати до публічних issues.

### Перед публікацією Plugin

- Виберіть власника, який відповідає scope пакета.
- Додайте `openclaw.plugin.json`. Code Plugins також потребують `package.json` з
  `openclaw.compat.pluginApi` і `openclaw.build.openclawVersion`.
- Щоб показати власну іконку картки Plugin, додайте `icon` до
  `openclaw.plugin.json` з будь-якою HTTPS URL-адресою зображення.
- Додайте репозиторій джерела та точні метадані коміту або використовуйте CLI з
  checkout, пов’язаного з GitHub, щоб він міг їх виявити.
- Запустіть `clawhub package validate <source>` перед публікацією. Для findings
  щодо пакета, manifest, SDK import або artifact див.
  [Виправлення перевірки Plugin](/uk/clawhub/plugin-validation-fixes).
- Запустіть `clawhub package publish <source> --dry-run` перед створенням
  релізу.
- Очікуйте, що нові релізи не потраплять до публічних поверхонь встановлення,
  доки не завершаться автоматизовані перевірки безпеки та верифікація.

### Trusted Publishing для пакетів

Package trusted publishing налаштовується у два кроки:

1. Опублікуйте пакет один раз через звичайний ручний або автентифікований
   токеном `clawhub package publish`. Це створює рядок пакета та визначає
   package managers, які можуть змінювати його trusted publisher config.
2. Package manager задає GitHub Actions trusted publisher config:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Після налаштування config майбутні підтримувані публікації GitHub Actions
можуть використовувати OIDC/trusted publishing без зберігання довгоживучого
токена ClawHub у репозиторії. Налаштований репозиторій і назва workflow-файлу
мають відповідати GitHub Actions OIDC claim. Якщо ви також передаєте
`--environment <name>`, GitHub Actions environment claim має точно відповідати
цій назві.

ClawHub перевіряє налаштований GitHub-репозиторій під час задавання trusted
publisher config. Публічні репозиторії можна перевірити через публічні
метадані GitHub. Для приватних репозиторіїв ClawHub потрібен доступ GitHub до
цього репозиторію, наприклад через майбутнє встановлення ClawHub GitHub App або
іншу авторизовану інтеграцію GitHub.

Поточний багаторазовий package publish workflow підтримує secretless trusted
publishing для публікацій `workflow_dispatch`, коли доступний `id-token: write`.
Справжні публікації через tag-push усе ще потребують `clawhub_token`, тому
залишайте `CLAWHUB_TOKEN` доступним для tag-релізів, перших публікацій,
untrusted packages або break-glass публікацій.

Перегляньте або видаліть config за допомогою:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Видалення trusted publisher config — це шлях rollback. Воно вимикає майбутнє
створення trusted publish token, доки package manager знову не задасть config.

## FAQ

### Scope пакета має відповідати вибраному власнику

Якщо scope пакета та вибраний власник не збігаються, ClawHub відхиляє
публікацію:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Щоб виправити це, або виберіть власника, названого scope пакета, або
перейменуйте пакет так, щоб scope відповідав власнику, від імені якого ви
можете публікувати.

Якщо назва пакета вже має правильний scope, але пакет належить неправильному
публікатору, натомість передайте право власності:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Використовуйте transfer пакета або Skills лише тоді, коли маєте
адміністративний доступ і до поточного власника, і до цільового публікатора.
Package transfer не дозволяє публікувати в scope, яким ви не можете керувати.

Якщо ви не маєте доступу до поточного власника, але вважаєте, що ваша
організація, проєкт або бренд є законним власником namespace, відкрийте
[issue для заявки на організацію / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
із публічним, неконфіденційним доказом для розгляду staff. Перед поданням див.
[Заявки на організації та namespace](/uk/clawhub/namespace-claims).

Це захищає namespaces організацій. Пакет із назвою `@openclaw/dronzer` заявляє
namespace `@openclaw`, тому лише публікатори з доступом до власника `@openclaw`
можуть його опублікувати.
