---
read_when:
    - Publicando Skills
    - Depurando falhas de publicação
summary: Formato da pasta de Skill, arquivos obrigatórios, tipos de arquivo permitidos, limites.
x-i18n:
    generated_at: "2026-07-04T10:31:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Formato de Skill

## No disco

Uma skill é uma pasta.

Obrigatório:

- `SKILL.md` (ou `skill.md`; o legado `skills.md` também é aceito)

Opcional:

- quaisquer arquivos _baseados em texto_ de suporte (consulte “Arquivos permitidos”)
- `.clawhubignore` (padrões de ignorar para publicação, legado `.clawdhubignore`)
- `.gitignore` (também respeitado)

## Importação do GitHub

O importador web do GitHub é mais rígido que a publicação/sincronização local. Ele só descobre arquivos
`SKILL.md` ou o legado `skills.md` em repositórios públicos, que não sejam forks, pertencentes à
conta do GitHub conectada. Ele não importa repositórios privados, forks,
repositórios arquivados/desabilitados ou repositórios públicos de terceiros.

Metadados de instalação local (escritos pela CLI):

- `<skill>/.clawhub/origin.json` (legado `.clawdhub`)

Estado de instalação do diretório de trabalho (escrito pela CLI):

- `<workdir>/.clawhub/lock.json` (legado `.clawdhub`)

## `SKILL.md`

- Markdown com frontmatter YAML opcional.
- O servidor extrai metadados do frontmatter durante a publicação.
- `description` é usado como o resumo da skill na UI/busca.

## Metadados de frontmatter

Os metadados da Skill são declarados no frontmatter YAML no topo do seu `SKILL.md`. Isso informa ao registro (e à análise de segurança) o que sua skill precisa para executar.

### Frontmatter básico

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Metadados de runtime (`metadata.openclaw`)

Declare os requisitos de runtime da sua skill em `metadata.openclaw` (aliases: `metadata.clawdbot`, `metadata.clawdis`).

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

Use `requires.env` para variáveis de ambiente que precisam estar presentes antes que a skill possa executar. Use `envVars` quando precisar de metadados por variável, incluindo variáveis opcionais com `required: false`.

### Referência completa de campos

| Campo              | Tipo       | Descrição                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variáveis de ambiente obrigatórias que sua skill espera.                                                                                           |
| `requires.bins`    | `string[]` | Binários de CLI que precisam estar todos instalados.                                                                                                     |
| `requires.anyBins` | `string[]` | Binários de CLI em que pelo menos um precisa existir.                                                                                                  |
| `requires.config`  | `string[]` | Caminhos de arquivos de configuração que sua skill lê.                                                                                                          |
| `primaryEnv`       | `string`   | A variável de ambiente principal de credencial para sua skill.                                                                                                  |
| `envVars`          | `array`    | Declarações de variáveis de ambiente com `name`, `required` opcional e `description` opcional. Defina `required: false` para variáveis de ambiente opcionais. |
| `always`           | `boolean`  | Se `true`, a skill está sempre ativa (nenhuma instalação explícita necessária).                                                                              |
| `skillKey`         | `string`   | Substitui a chave de invocação da skill.                                                                                                         |
| `emoji`            | `string`   | Emoji de exibição para a skill.                                                                                                                 |
| `homepage`         | `string`   | URL para a página inicial ou documentação da skill.                                                                                                         |
| `os`               | `string[]` | Restrições de SO (por exemplo, `["macos"]`, `["linux"]`).                                                                                             |
| `install`          | `array`    | Especificações de instalação para dependências (veja abaixo).                                                                                                  |
| `nix`              | `object`   | Especificação de Plugin Nix (veja o README).                                                                                                                |
| `config`           | `object`   | Especificação de configuração do Clawdbot (veja o README).                                                                                                           |

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

Declare variáveis de ambiente opcionais em `metadata.openclaw.envVars` e defina `required: false`. Não adicione entradas opcionais a `requires.env`, porque `requires.env` significa que a skill não pode executar sem elas.

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

A análise de segurança do ClawHub verifica se o que sua skill declara corresponde ao que ela realmente faz. Se seu código referencia `TODOIST_API_KEY`, mas seu frontmatter não o declara em `requires.env`, `primaryEnv` ou `envVars`, a análise sinalizará uma incompatibilidade de metadados. Manter as declarações precisas ajuda sua skill a passar pela revisão e ajuda os usuários a entenderem o que estão instalando.

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

- A lista de extensões permitidas está em `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Arquivos de script ainda são verificados após o upload; arquivos PowerShell `.ps1`, `.psm1` e `.psd1` são aceitos como texto.
- Tipos de conteúdo começando com `text/` são tratados como texto, além de uma pequena lista de permissões (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limites (no lado do servidor):

- Tamanho total do pacote: 50 MB.
- O texto de embedding inclui `SKILL.md` + até cerca de 40 arquivos não `.md` (limite de melhor esforço).

## Slugs

- Derivados do nome da pasta por padrão.
- Escopos de pacote devem corresponder exatamente ao identificador do publicador no ClawHub. Identificadores de publicador podem usar letras minúsculas, números, hifens, pontos e sublinhados; eles devem começar e terminar com uma letra minúscula ou número.
- Slugs de pacote devem ser minúsculos e seguros para npm, por exemplo `@example.tools/demo-plugin` ou `demo-plugin`.

## Versionamento + tags

- Cada publicação cria uma nova versão (semver).
- Tags são ponteiros de string para uma versão; `latest` é usado com frequência.

## Licença

- Todas as skills publicadas no ClawHub são licenciadas sob `MIT-0`.
- Qualquer pessoa pode usar, modificar e redistribuir skills publicadas, inclusive comercialmente.
- Atribuição não é obrigatória.
- Não adicione termos de licença conflitantes em `SKILL.md`; o ClawHub não oferece suporte a substituições de licença por skill.

## Skills pagas

- O ClawHub não oferece suporte a skills pagas, preços por skill, paywalls ou compartilhamento de receita.
- Não adicione metadados de preço a `SKILL.md`; isso não faz parte do formato de skill e não tornará uma skill publicada paga.
- Se sua skill se integra a um serviço de terceiros pago, documente claramente o custo externo e a conta necessária nas instruções da skill e nas declarações de ambiente (`requires.env` para variáveis obrigatórias ou `envVars` com `required: false` para variáveis opcionais).
