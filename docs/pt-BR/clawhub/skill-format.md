---
read_when:
    - Publicação de Skills
    - Depuração de falhas de publicação/sincronização
summary: Formato da pasta de Skill, arquivos obrigatórios, tipos de arquivo permitidos, limites.
x-i18n:
    generated_at: "2026-05-12T04:10:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Formato de skill

## No disco

Uma skill é uma pasta.

Obrigatório:

- `SKILL.md` (ou `skill.md`)

Opcional:

- quaisquer arquivos de suporte _baseados em texto_ (veja “Arquivos permitidos”)
- `.clawhubignore` (padrões de ignorar para publicação/sincronização, legado `.clawdhubignore`)
- `.gitignore` (também respeitado)

Metadados de instalação local (gravados pela CLI):

- `<skill>/.clawhub/origin.json` (legado `.clawdhub`)

Estado de instalação do diretório de trabalho (gravado pela CLI):

- `<workdir>/.clawhub/lock.json` (legado `.clawdhub`)

## `SKILL.md`

- Markdown com frontmatter YAML opcional.
- O servidor extrai metadados do frontmatter durante a publicação.
- `description` é usado como o resumo da skill na UI/pesquisa.

## Metadados de frontmatter

Os metadados da skill são declarados no frontmatter YAML no início do seu `SKILL.md`. Isso informa ao registro (e à análise de segurança) do que sua skill precisa para ser executada.

### Frontmatter básico

```yaml
---
name: my-skill
description: Resumo curto do que esta skill faz.
version: 1.0.0
---
```

### Metadados de runtime (`metadata.openclaw`)

Declare os requisitos de runtime da sua skill em `metadata.openclaw` (aliases: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Gerencie tarefas pela API do Todoist.
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

Use `requires.env` para variáveis de ambiente que precisam estar presentes antes que a skill possa ser executada. Use `envVars` quando você precisar de metadados por variável, incluindo variáveis opcionais com `required: false`.

### Referência completa de campos

| Campo              | Tipo       | Descrição                                                                                                                                                    |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `requires.env`     | `string[]` | Variáveis de ambiente obrigatórias que sua skill espera.                                                                                                     |
| `requires.bins`    | `string[]` | Binários de CLI que precisam estar todos instalados.                                                                                                         |
| `requires.anyBins` | `string[]` | Binários de CLI dos quais pelo menos um precisa existir.                                                                                                     |
| `requires.config`  | `string[]` | Caminhos de arquivos de configuração que sua skill lê.                                                                                                       |
| `primaryEnv`       | `string`   | A principal variável de ambiente de credencial da sua skill.                                                                                                 |
| `envVars`          | `array`    | Declarações de variáveis de ambiente com `name`, `required` opcional e `description` opcional. Defina `required: false` para env vars opcionais.             |
| `always`           | `boolean`  | Se `true`, a skill fica sempre ativa (sem necessidade de instalação explícita).                                                                               |
| `skillKey`         | `string`   | Substitui a chave de invocação da skill.                                                                                                                     |
| `emoji`            | `string`   | Emoji de exibição da skill.                                                                                                                                  |
| `homepage`         | `string`   | URL da página inicial ou da documentação da skill.                                                                                                           |
| `os`               | `string[]` | Restrições de SO (por exemplo, `["macos"]`, `["linux"]`).                                                                                                    |
| `install`          | `array`    | Especificações de instalação para dependências (veja abaixo).                                                                                                |
| `nix`              | `object`   | Especificação de Plugin Nix (veja o README).                                                                                                                 |
| `config`           | `object`   | Especificação de configuração do Clawdbot (veja o README).                                                                                                   |

### Especificações de instalação

Se sua skill precisar que dependências sejam instaladas, declare-as no array `install`:

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

Declare variáveis de ambiente opcionais em `metadata.openclaw.envVars` e defina `required: false`. Não adicione entradas opcionais a `requires.env`, porque `requires.env` significa que a skill não pode ser executada sem elas.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Token da API do Todoist usado para requisições autenticadas.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID opcional do projeto padrão quando o usuário não especifica um.
```

### Por que isso importa

A análise de segurança do ClawHub verifica se o que sua skill declara corresponde ao que ela realmente faz. Se seu código referencia `TODOIST_API_KEY`, mas seu frontmatter não o declara em `requires.env`, `primaryEnv` ou `envVars`, a análise sinalizará uma incompatibilidade de metadados. Manter as declarações precisas ajuda sua skill a passar na revisão e ajuda os usuários a entender o que estão instalando.

### Exemplo: frontmatter completo

```yaml
---
name: todoist-cli
description: Gerencie tarefas, projetos e etiquetas do Todoist pela linha de comando.
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
        description: Token da API do Todoist.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID opcional do projeto padrão.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Arquivos permitidos

Somente arquivos “baseados em texto” são aceitos pela publicação.

- A lista de extensões permitidas está em `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Arquivos de script ainda são verificados após o upload; arquivos PowerShell `.ps1`, `.psm1` e `.psd1` são aceitos como texto.
- Tipos de conteúdo que começam com `text/` são tratados como texto; além de uma pequena lista de permissões (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limites (no lado do servidor):

- Tamanho total do pacote: 50 MB.
- O texto de embedding inclui `SKILL.md` + até ~40 arquivos que não sejam `.md` (limite por melhor esforço).

## Slugs

- Derivados do nome da pasta por padrão.
- Precisam estar em minúsculas e ser seguros para URL: `^[a-z0-9][a-z0-9-]*$`.

## Versionamento + tags

- Cada publicação cria uma nova versão (semver).
- Tags são ponteiros de string para uma versão; `latest` é comumente usado.

## Licença

- Todas as skills publicadas no ClawHub são licenciadas sob `MIT-0`.
- Qualquer pessoa pode usar, modificar e redistribuir skills publicadas, inclusive comercialmente.
- Atribuição não é obrigatória.
- Não adicione termos de licença conflitantes em `SKILL.md`; o ClawHub não dá suporte a substituições de licença por skill.

## Skills pagas

- O ClawHub não dá suporte a skills pagas, preços por skill, paywalls ou compartilhamento de receita.
- Não adicione metadados de preço a `SKILL.md`; isso não faz parte do formato de skill e não tornará uma skill publicada paga.
- Se sua skill se integra a um serviço pago de terceiros, documente claramente o custo externo e a conta necessária nas instruções da skill e nas declarações de env (`requires.env` para variáveis obrigatórias, ou `envVars` com `required: false` para variáveis opcionais).
