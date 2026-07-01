---
read_when:
    - Publicação de Skills
    - Depurando falhas de publicação
summary: Formato da pasta de Skills, arquivos obrigatórios, tipos de arquivo permitidos, limites.
x-i18n:
    generated_at: "2026-07-01T05:32:31Z"
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

- quaisquer arquivos _baseados em texto_ de suporte (veja “Arquivos permitidos”)
- `.clawhubignore` (padrões de ignorar para publicação, legado `.clawdhubignore`)
- `.gitignore` (também respeitado)

## Importação do GitHub

O importador web do GitHub é mais rigoroso que a publicação/sincronização local. Ele descobre apenas
arquivos `SKILL.md` ou legados `skills.md` em repositórios públicos, que não sejam forks, pertencentes à
conta do GitHub conectada. Ele não importa repositórios privados, forks,
repositórios arquivados/desativados nem repositórios públicos de terceiros.

Metadados de instalação local (gravados pela CLI):

- `<skill>/.clawhub/origin.json` (legado `.clawdhub`)

Estado de instalação do workdir (gravado pela CLI):

- `<workdir>/.clawhub/lock.json` (legado `.clawdhub`)

## `SKILL.md`

- Markdown com frontmatter YAML opcional.
- O servidor extrai metadados do frontmatter durante a publicação.
- `description` é usado como o resumo da habilidade na UI/pesquisa.

## Metadados do frontmatter

Os metadados da habilidade são declarados no frontmatter YAML no topo do seu `SKILL.md`. Isso informa ao registro (e à análise de segurança) o que sua habilidade precisa para ser executada.

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

Use `requires.env` para variáveis de ambiente que devem estar presentes antes que a habilidade possa ser executada. Use `envVars` quando precisar de metadados por variável, incluindo variáveis opcionais com `required: false`.

### Referência completa dos campos

| Campo              | Tipo       | Descrição                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variáveis de ambiente obrigatórias que sua habilidade espera.                                                                                           |
| `requires.bins`    | `string[]` | Binários de CLI que devem estar todos instalados.                                                                                                     |
| `requires.anyBins` | `string[]` | Binários de CLI em que pelo menos um deve existir.                                                                                                  |
| `requires.config`  | `string[]` | Caminhos de arquivos de configuração que sua habilidade lê.                                                                                                          |
| `primaryEnv`       | `string`   | A principal variável de ambiente de credencial para sua habilidade.                                                                                                  |
| `envVars`          | `array`    | Declarações de variáveis de ambiente com `name`, `required` opcional e `description` opcional. Defina `required: false` para variáveis de ambiente opcionais. |
| `always`           | `boolean`  | Se `true`, a habilidade está sempre ativa (nenhuma instalação explícita necessária).                                                                              |
| `skillKey`         | `string`   | Substitui a chave de invocação da habilidade.                                                                                                         |
| `emoji`            | `string`   | Emoji de exibição para a habilidade.                                                                                                                 |
| `homepage`         | `string`   | URL da página inicial ou da documentação da habilidade.                                                                                                         |
| `os`               | `string[]` | Restrições de SO (por exemplo, `["macos"]`, `["linux"]`).                                                                                             |
| `install`          | `array`    | Especificações de instalação para dependências (veja abaixo).                                                                                                  |
| `nix`              | `object`   | Especificação do plugin Nix (veja o README).                                                                                                                |
| `config`           | `object`   | Especificação de configuração do Clawdbot (veja o README).                                                                                                           |

### Especificações de instalação

Se sua habilidade precisar que dependências sejam instaladas, declare-as no array `install`:

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

Declare variáveis de ambiente opcionais em `metadata.openclaw.envVars` e defina `required: false`. Não adicione entradas opcionais a `requires.env`, porque `requires.env` significa que a habilidade não pode ser executada sem elas.

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

A análise de segurança do ClawHub verifica se o que sua habilidade declara corresponde ao que ela realmente faz. Se seu código referencia `TODOIST_API_KEY`, mas seu frontmatter não a declara em `requires.env`, `primaryEnv` ou `envVars`, a análise sinalizará uma incompatibilidade de metadados. Manter as declarações precisas ajuda sua habilidade a passar na revisão e ajuda os usuários a entenderem o que estão instalando.

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

Apenas arquivos “baseados em texto” são aceitos pela publicação.

- A lista de extensões permitidas está em `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Arquivos de script ainda são escaneados após o upload; arquivos PowerShell `.ps1`, `.psm1` e `.psd1` são aceitos como texto.
- Tipos de conteúdo que começam com `text/` são tratados como texto; além de uma pequena lista permitida (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limites (no servidor):

- Tamanho total do bundle: 50 MB.
- O texto para embedding inclui `SKILL.md` + até cerca de 40 arquivos que não sejam `.md` (limite de melhor esforço).

## Slugs

- Derivados do nome da pasta por padrão.
- Escopos de pacote devem corresponder exatamente ao identificador do publicador no ClawHub. Identificadores de publicador podem usar letras minúsculas, números, hífens, pontos e underscores; eles devem começar e terminar com uma letra minúscula ou número.
- Slugs de pacote devem estar em minúsculas e ser seguros para npm, por exemplo `@example.tools/demo-plugin` ou `demo-plugin`.

## Versionamento + tags

- Cada publicação cria uma nova versão (semver).
- Tags são ponteiros de string para uma versão; `latest` é comumente usada.

## Licença

- Todas as Skills publicadas no ClawHub são licenciadas sob `MIT-0`.
- Qualquer pessoa pode usar, modificar e redistribuir Skills publicadas, inclusive comercialmente.
- Atribuição não é obrigatória.
- Não adicione termos de licença conflitantes em `SKILL.md`; o ClawHub não oferece suporte a substituições de licença por habilidade.

## Skills pagas

- O ClawHub não oferece suporte a Skills pagas, precificação por habilidade, paywalls nem compartilhamento de receita.
- Não adicione metadados de preço a `SKILL.md`; isso não faz parte do formato de habilidade e não tornará uma habilidade publicada paga.
- Se sua habilidade se integrar a um serviço pago de terceiros, documente claramente o custo externo e a conta necessária nas instruções da habilidade e nas declarações de ambiente (`requires.env` para variáveis obrigatórias, ou `envVars` com `required: false` para variáveis opcionais).
