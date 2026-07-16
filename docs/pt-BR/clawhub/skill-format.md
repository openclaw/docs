---
read_when:
    - Publicação de Skills
    - Depuração de falhas de publicação
summary: Formato da pasta de Skills, arquivos obrigatórios, tipos de arquivo permitidos, limites.
x-i18n:
    generated_at: "2026-07-16T12:17:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Formato de Skill

## No disco

Uma skill é uma pasta.

Obrigatório:

- `SKILL.md` (ou `skill.md`; o formato legado `skills.md` também é aceito)

Opcional:

- quaisquer arquivos auxiliares _baseados em texto_ (consulte “Arquivos permitidos”)
- `.clawhubignore` (padrões de exclusão para publicação, formato legado `.clawdhubignore`)
- `.gitignore` (também é respeitado)

## Importação do GitHub

O importador web do GitHub é mais restritivo que a publicação/sincronização local. Ele só encontra
arquivos `SKILL.md` ou no formato legado `skills.md` em repositórios públicos que não sejam forks e pertençam
à conta do GitHub conectada. Ele não importa repositórios privados, forks,
repositórios arquivados/desativados nem repositórios públicos de terceiros.

Metadados da instalação local (gravados pela CLI):

- `<skill>/.clawhub/origin.json` (formato legado `.clawdhub`)

Estado de instalação do diretório de trabalho (gravado pela CLI):

- `<workdir>/.clawhub/lock.json` (formato legado `.clawdhub`)

## `SKILL.md`

- Markdown com frontmatter YAML opcional.
- O servidor extrai os metadados do frontmatter durante a publicação.
- `description` é usado como resumo da skill na interface/pesquisa.

Para Agent Skills portáveis, `name` deve corresponder ao diretório pai e usar
de 1 a 64 letras minúsculas, números ou hifens. O ClawHub mantém separados o slug roteável e
o nome de exibição do catálogo, portanto, nomes existentes de outros clientes continuam
publicáveis e não são reescritos silenciosamente. As listas do catálogo podem abreviar nomes longos
visualmente sem alterar o nome armazenado.

## Metadados do frontmatter

Os metadados da skill são declarados no frontmatter YAML no início do seu `SKILL.md`. Isso informa ao registro (e à análise de segurança) o que sua skill precisa para ser executada.

### Frontmatter básico

```yaml
---
name: my-skill
description: Resumo breve do que esta skill faz.
version: 1.0.0
---
```

### Metadados de runtime (`metadata.openclaw`)

Declare os requisitos de runtime da sua skill em `metadata.openclaw` (aliases: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Gerencie tarefas por meio da API do Todoist.
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

Use `requires.env` para variáveis de ambiente que devem estar presentes antes que a skill possa ser executada. Use `envVars` quando precisar de metadados por variável, incluindo variáveis opcionais com `required: false`.

### Referência completa dos campos

| Campo              | Tipo       | Descrição                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variáveis de ambiente obrigatórias esperadas pela sua skill.                                                                                           |
| `requires.bins`    | `string[]` | Binários da CLI que devem estar todos instalados.                                                                                                     |
| `requires.anyBins` | `string[]` | Binários da CLI dos quais pelo menos um deve existir.                                                                                                  |
| `requires.config`  | `string[]` | Caminhos de arquivos de configuração lidos pela sua skill.                                                                                                          |
| `primaryEnv`       | `string`   | A principal variável de ambiente de credencial da sua skill.                                                                                                  |
| `envVars`          | `array`    | Declarações de variáveis de ambiente com `name`, `required` opcional e `description` opcional. Defina `required: false` para variáveis de ambiente opcionais. |
| `always`           | `boolean`  | Se `true`, a skill estará sempre ativa (sem necessidade de instalação explícita).                                                                              |
| `skillKey`         | `string`   | Substitui a chave de invocação da skill.                                                                                                         |
| `emoji`            | `string`   | Emoji de exibição da skill.                                                                                                                 |
| `homepage`         | `string`   | URL da página inicial ou da documentação da skill.                                                                                                         |
| `os`               | `string[]` | Restrições de SO (por exemplo, `["macos"]`, `["linux"]`).                                                                                             |
| `install`          | `array`    | Especificações de instalação de dependências (consulte abaixo).                                                                                                  |
| `nix`              | `object`   | Especificação do plugin Nix (consulte o README).                                                                                                                |
| `config`           | `object`   | Especificação de configuração do Clawdbot (consulte o README).                                                                                                           |

### Especificações de instalação

Se sua skill precisar da instalação de dependências, declare-as no array `install`:

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

Declare variáveis de ambiente opcionais em `metadata.openclaw.envVars` e defina `required: false`. Não adicione entradas opcionais a `requires.env`, pois `requires.env` significa que a skill não pode ser executada sem elas.

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
        description: ID opcional do projeto padrão quando o usuário não especifica um.
```

### Por que isso é importante

A análise de segurança do ClawHub verifica se o que sua skill declara corresponde ao que ela realmente faz. Se seu código fizer referência a `TODOIST_API_KEY`, mas seu frontmatter não a declarar em `requires.env`, `primaryEnv` ou `envVars`, a análise sinalizará uma incompatibilidade de metadados. Manter as declarações precisas ajuda sua skill a passar pela revisão e os usuários a entender o que estão instalando.

### Exemplo: frontmatter completo

```yaml
---
name: todoist-cli
description: Gerencie tarefas, projetos e rótulos do Todoist pela linha de comando.
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
- Os arquivos de script ainda são verificados após o upload; arquivos `.ps1`, `.psm1` e `.psd1` do PowerShell são aceitos como texto.
- Tipos de conteúdo que começam com `text/` são tratados como texto, além de uma pequena lista de formatos permitidos (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limites (no lado do servidor):

- Tamanho total do pacote: 50MB.
- O texto de embedding inclui `SKILL.md` + até cerca de 40 arquivos que não sejam `.md` (limite de melhor esforço).

## Slugs

- Derivados do nome da pasta por padrão.
- Os escopos dos pacotes devem corresponder exatamente ao identificador do publicador no ClawHub. Os identificadores de publicador podem usar letras minúsculas, números, hifens, pontos e sublinhados; devem começar e terminar com uma letra minúscula ou um número.
- Os slugs dos pacotes devem estar em letras minúsculas e ser compatíveis com npm, por exemplo, `@example.tools/demo-plugin` ou `demo-plugin`.

## Versionamento + tags

- Cada publicação cria uma nova versão (semver).
- Tags são ponteiros em formato de string para uma versão; `latest` é usado com frequência.

## Licença

- Todas as skills publicadas no ClawHub são licenciadas sob `MIT-0`.
- Qualquer pessoa pode usar, modificar e redistribuir as skills publicadas, inclusive comercialmente.
- A atribuição não é obrigatória.
- Não adicione termos de licença conflitantes em `SKILL.md`; o ClawHub não permite substituições de licença por skill.

## Skills pagas

- O ClawHub não oferece suporte a skills pagas, preços por skill, paywalls nem compartilhamento de receita.
- Não adicione metadados de preços a `SKILL.md`; eles não fazem parte do formato de skill e não tornarão uma skill publicada paga.
- Se sua skill se integrar a um serviço pago de terceiros, documente claramente o custo externo e a conta necessária nas instruções da skill e nas declarações de ambiente (`requires.env` para variáveis obrigatórias ou `envVars` com `required: false` para variáveis opcionais).
