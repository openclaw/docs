---
read_when:
    - Publicação de Skills
    - Depuração de falhas de publicação
summary: Formato de pasta de Skill, arquivos obrigatórios, tipos de arquivo permitidos, limites.
x-i18n:
    generated_at: "2026-07-03T09:26:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Formato de habilidade

## No disco

Uma habilidade é uma pasta.

Obrigatório:

- `SKILL.md` (ou `skill.md`; o legado `skills.md` também é aceito)

Opcional:

- quaisquer arquivos de suporte _baseados em texto_ (veja “Arquivos permitidos”)
- `.clawhubignore` (padrões de ignore para publicação, legado `.clawdhubignore`)
- `.gitignore` (também respeitado)

## Importação do GitHub

O importador web do GitHub é mais rigoroso do que publicação/sincronização local. Ele só descobre arquivos
`SKILL.md` ou legados `skills.md` em repositórios públicos, não fork, pertencentes à
conta do GitHub conectada. Ele não importa repositórios privados, forks,
repositórios arquivados/desabilitados nem repositórios públicos de terceiros.

Metadados de instalação local (gravados pela CLI):

- `<skill>/.clawhub/origin.json` (legado `.clawdhub`)

Estado de instalação do workdir (gravado pela CLI):

- `<workdir>/.clawhub/lock.json` (legado `.clawdhub`)

## `SKILL.md`

- Markdown com frontmatter YAML opcional.
- O servidor extrai metadados do frontmatter durante a publicação.
- `description` é usado como o resumo da habilidade na UI/pesquisa.

## Metadados de frontmatter

Os metadados da habilidade são declarados no frontmatter YAML no topo do seu `SKILL.md`. Isso informa ao registro (e à análise de segurança) o que sua habilidade precisa para executar.

### Frontmatter básico

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Metadados de runtime (`metadata.openclaw`)

Declare os requisitos de runtime da sua habilidade em `metadata.openclaw` (aliases: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

Use `requires.env` para variáveis de ambiente que precisam estar presentes antes que a habilidade possa executar. Use `envVars` quando precisar de metadados por variável, incluindo variáveis opcionais com `required: false`.

### Referência completa dos campos

| Campo              | Tipo       | Descrição                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variáveis de ambiente obrigatórias que sua habilidade espera.                                                                                           |
| `requires.bins`    | `string[]` | Binários de CLI que devem estar todos instalados.                                                                                                     |
| `requires.anyBins` | `string[]` | Binários de CLI em que pelo menos um deve existir.                                                                                                  |
| `requires.config`  | `string[]` | Caminhos de arquivos de configuração que sua habilidade lê.                                                                                                          |
| `primaryEnv`       | `string`   | A variável de ambiente principal de credencial da sua habilidade.                                                                                                  |
| `envVars`          | `array`    | Declarações de variáveis de ambiente com `name`, `required` opcional e `description` opcional. Defina `required: false` para variáveis de ambiente opcionais. |
| `always`           | `boolean`  | Se `true`, a habilidade fica sempre ativa (sem necessidade de instalação explícita).                                                                              |
| `skillKey`         | `string`   | Substitui a chave de invocação da habilidade.                                                                                                         |
| `emoji`            | `string`   | Emoji de exibição da habilidade.                                                                                                                 |
| `homepage`         | `string`   | URL da página inicial ou da documentação da habilidade.                                                                                                         |
| `os`               | `string[]` | Restrições de SO (por exemplo, `["macos"]`, `["linux"]`).                                                                                             |
| `install`          | `array`    | Especificações de instalação para dependências (veja abaixo).                                                                                                  |
| `nix`              | `object`   | Especificação de plugin Nix (veja README).                                                                                                                |
| `config`           | `object`   | Especificação de configuração do Clawdbot (veja README).                                                                                                           |

### Especificações de instalação

Se sua habilidade precisa que dependências sejam instaladas, declare-as no array `install`:

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

Tipos de instalação compatíveis: `brew`, `node`, `go`, `uv`.

### Variáveis de ambiente opcionais

Declare variáveis de ambiente opcionais em `metadata.openclaw.envVars` e defina `required: false`. Não adicione entradas opcionais a `requires.env`, porque `requires.env` significa que a habilidade não pode executar sem elas.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### Por que isso importa

A análise de segurança do ClawHub verifica se o que sua habilidade declara corresponde ao que ela realmente faz. Se seu código referencia `TODOIST_API_KEY`, mas seu frontmatter não a declara em `requires.env`, `primaryEnv` ou `envVars`, a análise sinalizará uma incompatibilidade de metadados. Manter as declarações precisas ajuda sua habilidade a passar pela revisão e ajuda os usuários a entenderem o que estão instalando.

### Exemplo: frontmatter completo

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Arquivos permitidos

Somente arquivos “baseados em texto” são aceitos pela publicação.

- A allowlist de extensões está em `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Arquivos de script ainda são verificados após o upload; arquivos PowerShell `.ps1`, `.psm1` e `.psd1` são aceitos como texto.
- Tipos de conteúdo que começam com `text/` são tratados como texto; além de uma pequena allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limites (no servidor):

- Tamanho total do pacote: 50 MB.
- Texto de embedding inclui `SKILL.md` + até cerca de 40 arquivos não `.md` (limite de melhor esforço).

## Slugs

- Derivados do nome da pasta por padrão.
- Escopos de pacote devem corresponder exatamente ao handle do publicador do ClawHub. Handles de publicador podem usar letras minúsculas, números, hifens, pontos e sublinhados; eles devem começar e terminar com uma letra minúscula ou número.
- Slugs de pacote devem estar em minúsculas e ser seguros para npm, por exemplo `@example.tools/demo-plugin` ou `demo-plugin`.

## Versionamento + tags

- Cada publicação cria uma nova versão (semver).
- Tags são ponteiros de string para uma versão; `latest` é comumente usado.

## Licença

- Todas as habilidades publicadas no ClawHub são licenciadas sob `MIT-0`.
- Qualquer pessoa pode usar, modificar e redistribuir habilidades publicadas, inclusive comercialmente.
- Atribuição não é obrigatória.
- Não adicione termos de licença conflitantes em `SKILL.md`; o ClawHub não oferece suporte a substituições de licença por habilidade.

## Habilidades pagas

- O ClawHub não oferece suporte a habilidades pagas, precificação por habilidade, paywalls nem compartilhamento de receita.
- Não adicione metadados de preço a `SKILL.md`; isso não faz parte do formato de habilidade e não tornará uma habilidade publicada paga.
- Se sua habilidade se integra a um serviço pago de terceiros, documente claramente o custo externo e a conta necessária nas instruções da habilidade e nas declarações de ambiente (`requires.env` para variáveis obrigatórias, ou `envVars` com `required: false` para variáveis opcionais).
