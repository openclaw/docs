---
read_when:
    - Você está criando uma nova skill personalizada
    - Você precisa de um fluxo de trabalho inicial rápido para Skills baseadas em SKILL.md
    - Você quer usar o Skill Workshop para propor uma habilidade para análise pelo agente
sidebarTitle: Creating skills
summary: Crie, teste e publique Skills personalizadas de espaço de trabalho em SKILL.md para seus agentes do OpenClaw.
title: Criando Skills
x-i18n:
    generated_at: "2026-07-12T00:24:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills ensinam ao agente como e quando usar ferramentas. Cada skill é um diretório
que contém um arquivo `SKILL.md` com frontmatter YAML e instruções em Markdown.
O OpenClaw carrega skills de várias raízes em uma [ordem de precedência](/pt-BR/tools/skills#loading-order) definida.

## Crie sua primeira skill

<Steps>
  <Step title="Crie o diretório da skill">
    As Skills ficam na pasta `skills/` do seu espaço de trabalho:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Você pode agrupar skills em subpastas para organizá-las — a skill ainda é
    nomeada pelo frontmatter do `SKILL.md`, não pelo caminho da pasta:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # o nome da skill continua sendo "hello-world", invocada como /hello-world
    ```

  </Step>

  <Step title="Escreva o SKILL.md">
    O frontmatter define os metadados; o corpo fornece instruções ao agente.

    ```markdown
    ---
    name: hello-world
    description: Uma skill simples que exibe uma saudação.
    ---

    # Olá, mundo

    Quando o usuário pedir uma saudação, use a ferramenta `exec` para executar:

    ```bash
    echo "Olá da sua skill personalizada!"
    ```
    ```

    Regras de nomenclatura:
    - Use letras minúsculas, dígitos e hífens em `name`.
    - Mantenha o nome do diretório e o `name` do frontmatter alinhados.
    - `description` é exibido ao agente e na descoberta de comandos de barra —
      mantenha-o em uma única linha e com menos de 160 caracteres.

  </Step>

  <Step title="Verifique se a skill foi carregada">
    ```bash
    openclaw skills list
    ```

    Por padrão, o OpenClaw monitora arquivos `SKILL.md` nas raízes de skills. Se o
    monitor estiver desativado ou você estiver continuando uma sessão existente, inicie uma
    nova para que o agente receba a lista atualizada:

    ```bash
    # Pelo chat — arquive a sessão atual e inicie uma nova
    /new

    # Ou reinicie o Gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Teste">
    ```bash
    openclaw agent --message "me dê uma saudação"
    ```

    Ou abra um chat e peça diretamente ao agente. Use `/skill hello-world` para
    invocá-la explicitamente pelo nome.

  </Step>
</Steps>

## Referência do SKILL.md

### Campos obrigatórios

| Campo         | Descrição                                                              |
| ------------- | ---------------------------------------------------------------------- |
| `name`        | Identificador exclusivo com letras minúsculas, dígitos e hífens        |
| `description` | Descrição de uma linha exibida ao agente e na saída de descoberta      |

### Chaves opcionais do frontmatter

| Campo                      | Padrão  | Descrição                                                                            |
| -------------------------- | ------- | ------------------------------------------------------------------------------------ |
| `user-invocable`           | `true`  | Expõe a skill como um comando de barra do usuário                                    |
| `disable-model-invocation` | `false` | Mantém a skill fora do prompt de sistema do agente (ainda é executada via `/skill`)  |
| `command-dispatch`         | —       | Defina como `tool` para encaminhar o comando de barra diretamente a uma ferramenta, ignorando o modelo |
| `command-tool`             | —       | Nome da ferramenta a invocar quando `command-dispatch: tool` estiver definido       |
| `command-arg-mode`         | `raw`   | Para encaminhamento à ferramenta, repassa a string bruta de argumentos à ferramenta |
| `homepage`                 | —       | URL exibida como "Website" na interface de Skills do macOS                           |

Para campos de controle de disponibilidade (`requires.bins`, `requires.env` etc.), consulte
[Skills — Controle de disponibilidade](/pt-BR/tools/skills#gating).

### Como usar `{baseDir}`

Faça referência a arquivos dentro do diretório da skill sem fixar caminhos — o
agente resolve `{baseDir}` em relação ao próprio diretório da skill:

```markdown
Execute o script auxiliar em `{baseDir}/scripts/run.sh`.
```

## Como adicionar ativação condicional

Restrinja sua skill para que ela seja carregada somente quando suas dependências estiverem disponíveis:

```markdown
---
name: gemini-search
description: Pesquise usando a CLI do Gemini.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Opções de controle de disponibilidade">
    | Chave | Descrição |
    | --- | --- |
    | `requires.bins` | Todos os binários devem existir no `PATH` |
    | `requires.anyBins` | Pelo menos um binário deve existir no `PATH` |
    | `requires.env` | Cada variável de ambiente deve existir no processo ou na configuração |
    | `requires.config` | Cada caminho de `openclaw.json` deve ter um valor verdadeiro |
    | `os` | Filtro de plataforma: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Defina como `true` para ignorar todos os controles e sempre incluir a skill |

    Referência completa: [Skills — Controle de disponibilidade](/pt-BR/tools/skills#gating).

  </Accordion>
  <Accordion title="Ambiente e chaves de API">
    Vincule uma chave de API a uma entrada de skill em `openclaw.json`:

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    A chave é injetada no processo hospedeiro somente durante aquele turno do agente.
    Ela não chega à sandbox — consulte
    [variáveis de ambiente na sandbox](/pt-BR/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Proponha por meio do Skill Workshop

Para skills elaboradas pelo agente ou quando você quiser a revisão do operador antes que uma skill entre
em uso, utilize propostas do [Skill Workshop](/pt-BR/tools/skill-workshop) em vez de escrever
o `SKILL.md` diretamente.

```bash
# Proponha uma skill totalmente nova
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Uma skill simples que exibe uma saudação." \
  --proposal ./PROPOSAL.md

# Proponha uma atualização para uma skill existente
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Skill de saudação atualizada"
```

Use `--proposal-dir` quando a proposta incluir arquivos de suporte:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Uma skill simples que exibe uma saudação." \
  --proposal-dir ./hello-world-proposal/
```

O diretório deve conter `PROPOSAL.md` em sua raiz. Os arquivos de suporte devem ficar em
`assets/`, `examples/`, `references/`, `scripts/` ou `templates/`.

Após a revisão:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consulte [Skill Workshop](/pt-BR/tools/skill-workshop) para conhecer o ciclo de vida completo das propostas.

## Publicação no ClawHub

<Steps>
  <Step title="Verifique se o SKILL.md está completo">
    Confira se `name`, `description` e todos os campos de controle de disponibilidade em `metadata.openclaw`
    estão definidos. Adicione uma URL em `homepage` se você tiver uma página do projeto.
  </Step>
  <Step title="Instale a CLI independente do ClawHub e faça login">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Publique">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    Adicione `--version <version>` ou `--owner <owner>` para substituir a versão
    inferida ou publicar sob um proprietário específico. Consulte
    [ClawHub — Publicação](/pt-BR/clawhub/publishing) e
    [CLI do ClawHub](/pt-BR/clawhub/cli) para conhecer o fluxo completo, o escopo de proprietários e outros
    comandos de manutenção (`clawhub sync`, `clawhub skill rename`, ...).

  </Step>
</Steps>

## Práticas recomendadas

<Tip>
  - **Seja conciso** — instrua o modelo sobre *o que* fazer, não sobre como ser uma IA.
  - **Segurança em primeiro lugar** — se sua skill usar `exec`, garanta que os prompts não permitam
    a injeção de comandos arbitrários por meio de entradas não confiáveis.
  - **Teste localmente** — use `openclaw agent --message "..."` antes de compartilhar.
  - **Use o ClawHub** — explore as skills da comunidade em [clawhub.ai](https://clawhub.ai)
    antes de criar algo do zero.
</Tip>

## Conteúdo relacionado

<CardGroup cols={2}>
  <Card title="Referência de Skills" href="/pt-BR/tools/skills" icon="puzzle-piece">
    Ordem de carregamento, controle de disponibilidade, listas de permissões e formato do SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/pt-BR/tools/skill-workshop" icon="flask">
    Fila de propostas para skills elaboradas pelo agente.
  </Card>
  <Card title="Configuração de Skills" href="/pt-BR/tools/skills-config" icon="gear">
    Esquema completo de configuração de `skills.*`.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Explore e publique skills no registro público.
  </Card>
  <Card title="Criação de plugins" href="/pt-BR/plugins/building-plugins" icon="plug">
    Plugins podem incluir skills junto às ferramentas que elas documentam.
  </Card>
</CardGroup>
