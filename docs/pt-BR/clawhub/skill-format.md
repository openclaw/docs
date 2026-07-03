---
read_when:
    - Publicação de Skills
    - Depurando falhas de publicação
summary: Formato da pasta de Skill, arquivos obrigatórios, tipos de arquivo permitidos, limites.
x-i18n:
    generated_at: "2026-07-03T23:28:39Z"
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

- `SKILL.md` (ou `skill.md`; o `skills.md` legado também é aceito)

Opcional:

- quaisquer arquivos _baseados em texto_ de suporte (veja “Arquivos permitidos”)
- `.clawhubignore` (padrões de ignorar para publicação, `.clawdhubignore` legado)
- `.gitignore` (também respeitado)

## Importação do GitHub

O importador web do GitHub é mais rigoroso do que a publicação/sincronização local. Ele descobre apenas
arquivos `SKILL.md` ou `skills.md` legado em repositórios públicos, que não sejam forks, pertencentes à
conta do GitHub conectada. Ele não importa repositórios privados, forks,
repositórios arquivados/desabilitados nem repositórios públicos de terceiros.

Metadados de instalação local (gravados pela CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` legado)

Estado de instalação do workdir (gravado pela CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` legado)

## `SKILL.md`

- Markdown com frontmatter YAML opcional.
- O servidor extrai metadados do frontmatter durante a publicação.
- `description` é usado como o resumo da skill na UI/busca.

## Metadados de frontmatter

Os metadados da skill são declarados no frontmatter YAML no topo do seu `SKILL.md`. Isso informa ao registro (e à análise de segurança) o que sua skill precisa para executar.

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
description: Gerencie tarefas via API do Todoist.
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

Use `requires.env` para variáveis de ambiente que devem estar presentes antes que a skill possa executar. Use `envVars` quando precisar de metadados por variável, incluindo variáveis opcionais com `required: false`.

### Referência completa de campos

| Campo              | Tipo       | Descrição                                                                                                                                                 |
| ------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variáveis de ambiente obrigatórias que sua skill espera.                                                                                                  |
| `requires.bins`    | `string[]` | Binários de CLI que devem estar todos instalados.                                                                                                         |
| `requires.anyBins` | `string[]` | Binários de CLI dos quais pelo menos um deve existir.                                                                                                     |
| `requires.config`  | `string[]` | Caminhos de arquivos de configuração que sua skill lê.                                                                                                    |
| `primaryEnv`       | `string`   | A principal variável de ambiente de credencial para sua skill.                                                                                            |
| `envVars`          | `array`    | Declarações de variáveis de ambiente com `name`, `required` opcional e `description` opcional. Defina `required: false` para env vars opcionais.          |
| `always`           | `boolean`  | Se `true`, a skill está sempre ativa (nenhuma instalação explícita necessária).                                                                            |
| `skillKey`         | `string`   | Substitui a chave de invocação da skill.                                                                                                                  |
| `emoji`            | `string`   | Emoji de exibição para a skill.                                                                                                                           |
| `homepage`         | `string`   | URL da página inicial ou da documentação da skill.                                                                                                        |
| `os`               | `string[]` | Restrições de SO (por exemplo, `["macos"]`, `["linux"]`).                                                                                                 |
| `install`          | `array`    | Especificações de instalação para dependências (veja abaixo).                                                                                             |
| `nix`              | `object`   | Especificação de plugin Nix (veja README).                                                                                                                |
| `config`           | `object`   | Especificação de configuração do Clawdbot (veja README).                                                                                                  |

### Especificações de instalação

Se sua skill precisar de dependências instaladas, declare-as no array `install`:

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
        description: Token da API do Todoist usado para solicitações autenticadas.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID de projeto padrão opcional quando o usuário não especifica um.
```

### Por que isso importa

A análise de segurança do ClawHub verifica se o que sua skill declara corresponde ao que ela realmente faz. Se seu código referencia `TODOIST_API_KEY`, mas seu frontmatter não a declara em `requires.env`, `primaryEnv` ou `envVars`, a análise sinalizará uma incompatibilidade de metadados. Manter as declarações precisas ajuda sua skill a passar na revisão e ajuda os usuários a entender o que estão instalando.

### Exemplo: frontmatter completo

```yaml
---
name: todoist-cli
description: Gerencie tarefas, projetos e marcadores do Todoist pela linha de comando.
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
        description: ID de projeto padrão opcional.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Arquivos permitidos

Apenas arquivos “baseados em texto” são aceitos pela publicação.

- A lista de permissões de extensões está em `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Arquivos de script ainda são verificados após o upload; arquivos PowerShell `.ps1`, `.psm1` e `.psd1` são aceitos como texto.
- Tipos de conteúdo que começam com `text/` são tratados como texto; mais uma pequena lista de permissões (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limites (no servidor):

- Tamanho total do pacote: 50 MB.
- O texto para embedding inclui `SKILL.md` + até ~40 arquivos que não sejam `.md` (limite de melhor esforço).

## Slugs

- Derivados do nome da pasta por padrão.
- Escopos de pacote devem corresponder exatamente ao identificador de publicador do ClawHub. Identificadores de publicador podem usar letras minúsculas, números, hifens, pontos e sublinhados; devem começar e terminar com uma letra minúscula ou número.
- Slugs de pacote devem estar em minúsculas e ser seguros para npm, por exemplo `@example.tools/demo-plugin` ou `demo-plugin`.

## Versionamento + tags

- Cada publicação cria uma nova versão (semver).
- Tags são ponteiros de string para uma versão; `latest` é comumente usado.

## Licença

- Todas as skills publicadas no ClawHub são licenciadas sob `MIT-0`.
- Qualquer pessoa pode usar, modificar e redistribuir skills publicadas, inclusive comercialmente.
- Atribuição não é obrigatória.
- Não adicione termos de licença conflitantes em `SKILL.md`; o ClawHub não oferece suporte a substituições de licença por skill.

## Skills pagas

- O ClawHub não oferece suporte a skills pagas, preços por skill, paywalls ou compartilhamento de receita.
- Não adicione metadados de preço a `SKILL.md`; isso não faz parte do formato de skill e não tornará uma skill publicada paga.
- Se sua skill se integra a um serviço pago de terceiros, documente claramente o custo externo e a conta necessária nas instruções da skill e nas declarações de ambiente (`requires.env` para variáveis obrigatórias, ou `envVars` com `required: false` para variáveis opcionais).
