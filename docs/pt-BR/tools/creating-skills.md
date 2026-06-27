---
read_when:
    - Você está criando uma nova skill personalizada
    - Você precisa de um fluxo de trabalho inicial rápido para skills baseadas em SKILL.md
    - Você quer usar o Skill Workshop para propor uma habilidade para revisão por agente
sidebarTitle: Creating skills
summary: Crie, teste e publique Skills de workspace SKILL.md personalizadas para seus agentes OpenClaw.
title: Criando Skills
x-i18n:
    generated_at: "2026-06-27T18:14:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills ensinam ao agente como e quando usar ferramentas. Cada habilidade é um diretório
contendo um arquivo `SKILL.md` com frontmatter YAML e instruções em markdown.
O OpenClaw carrega Skills de várias raízes em uma [ordem de precedência](/pt-BR/tools/skills#loading-order) definida.

## Crie sua primeira habilidade

<Steps>
  <Step title="Crie o diretório da habilidade">
    Skills ficam na pasta `skills/` do seu workspace. Crie um diretório para sua
    nova habilidade:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Você pode agrupar Skills em subpastas para organização — a habilidade ainda é
    nomeada pelo frontmatter do `SKILL.md`, não pelo caminho da pasta:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Escreva o SKILL.md">
    Crie `SKILL.md` dentro do diretório. O frontmatter define metadados;
    o corpo fornece instruções ao agente.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    Regras de nomenclatura:
    - Use letras minúsculas, dígitos e hífens para `name`.
    - Mantenha o nome do diretório e o `name` do frontmatter alinhados.
    - `description` é exibido para o agente e na descoberta de comandos de barra —
      mantenha em uma linha e com menos de 160 caracteres.

  </Step>

  <Step title="Verifique se a habilidade foi carregada">
    ```bash
    openclaw skills list
    ```

    Por padrão, o OpenClaw monitora arquivos `SKILL.md` nas raízes de Skills. Se o
    monitor estiver desativado ou você estiver continuando uma sessão existente,
    inicie uma nova para que o agente receba a lista atualizada:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Teste">
    Envie uma mensagem que deve acionar a habilidade:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Ou abra um chat e pergunte diretamente ao agente. Use `/skill hello-world` para
    invocá-la explicitamente pelo nome.

  </Step>
</Steps>

## Referência do SKILL.md

### Campos obrigatórios

| Campo         | Descrição                                                     |
| ------------- | ------------------------------------------------------------- |
| `name`        | Slug único usando letras minúsculas, dígitos e hífens         |
| `description` | Descrição em uma linha exibida ao agente e na saída de descoberta |

### Chaves opcionais do frontmatter

| Campo                      | Padrão  | Descrição                                                                      |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | Expõe a habilidade como um comando de barra do usuário                          |
| `disable-model-invocation` | `false` | Mantém a habilidade fora do prompt de sistema do agente (ainda executa via `/skill`) |
| `command-dispatch`         | —       | Defina como `tool` para rotear o comando de barra diretamente para uma ferramenta, ignorando o modelo |
| `command-tool`             | —       | Nome da ferramenta a invocar quando `command-dispatch: tool` estiver definido   |
| `command-arg-mode`         | `raw`   | Para despacho de ferramenta, encaminha a string de argumentos bruta para a ferramenta |
| `homepage`                 | —       | URL exibida como "Site" na UI de Skills do macOS                                |

Para campos de controle de acesso (`requires.bins`, `requires.env` etc.), veja
[Skills — Controle de acesso](/pt-BR/tools/skills#gating).

### Usando `{baseDir}`

Use `{baseDir}` no corpo da habilidade para referenciar arquivos dentro do diretório
da habilidade sem codificar caminhos fixos:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## Adicionando ativação condicional

Restrinja sua habilidade para que ela só carregue quando suas dependências estiverem disponíveis:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Opções de controle de acesso">
    | Chave | Descrição |
    | --- | --- |
    | `requires.bins` | Todos os binários devem existir no `PATH` |
    | `requires.anyBins` | Pelo menos um binário deve existir no `PATH` |
    | `requires.env` | Cada variável de ambiente deve existir no processo ou na configuração |
    | `requires.config` | Cada caminho de `openclaw.json` deve ser verdadeiro |
    | `os` | Filtro de plataforma: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Defina como `true` para ignorar todos os controles e sempre incluir a habilidade |

    Referência completa: [Skills — Controle de acesso](/pt-BR/tools/skills#gating).

  </Accordion>
  <Accordion title="Ambiente e chaves de API">
    Vincule uma chave de API a uma entrada de habilidade em `openclaw.json`:

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

    A chave é injetada no processo host apenas para aquela rodada do agente.
    Ela não chega ao sandbox — veja
    [variáveis de ambiente em sandbox](/pt-BR/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Proponha via Workshop de Habilidades

Para Skills redigidas pelo agente ou quando você quiser revisão do operador antes de uma habilidade entrar
em produção, use propostas do [Workshop de Habilidades](/pt-BR/tools/skill-workshop) em vez de escrever
`SKILL.md` diretamente.

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

Use `--proposal-dir` quando a proposta incluir arquivos de suporte:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

O diretório deve conter `PROPOSAL.md`. Arquivos de suporte podem ficar em `assets/`,
`examples/`, `references/`, `scripts/` ou `templates/`.

Após a revisão:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Veja [Workshop de Habilidades](/pt-BR/tools/skill-workshop) para o ciclo de vida completo da proposta.

## Publicando no ClawHub

<Steps>
  <Step title="Garanta que seu SKILL.md esteja completo">
    Certifique-se de que `name`, `description` e quaisquer campos de controle
    `metadata.openclaw` estejam definidos. Adicione uma URL `homepage` se você tiver uma página do projeto.
  </Step>
  <Step title="Instale a habilidade do ClawHub">
    A habilidade do ClawHub documenta o formato atual do comando de publicação e os metadados
    obrigatórios:

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="Publique">
    ```bash
    clawhub publish
    ```

    Veja [ClawHub — Publicação](/pt-BR/clawhub/publishing) para o fluxo completo.

  </Step>
</Steps>

## Boas práticas

<Tip>
  - **Seja conciso** — instrua o modelo sobre *o que* fazer, não sobre como ser uma IA.
  - **Segurança em primeiro lugar** — se sua habilidade usa `exec`, garanta que os prompts não permitam
    injeção arbitrária de comandos a partir de entrada não confiável.
  - **Teste localmente** — use `openclaw agent --message "..."` antes de compartilhar.
  - **Use o ClawHub** — navegue pelas Skills da comunidade em [clawhub.ai](https://clawhub.ai)
    antes de criar do zero.
</Tip>

## Relacionados

<CardGroup cols={2}>
  <Card title="Referência de Skills" href="/pt-BR/tools/skills" icon="puzzle-piece">
    Ordem de carregamento, controle de acesso, allowlists e formato do SKILL.md.
  </Card>
  <Card title="Workshop de Habilidades" href="/pt-BR/tools/skill-workshop" icon="flask">
    Fila de propostas para Skills redigidas pelo agente.
  </Card>
  <Card title="Configuração de Skills" href="/pt-BR/tools/skills-config" icon="gear">
    Esquema completo de configuração `skills.*`.
  </Card>
  <Card title="ClawHub" href="/pt-BR/clawhub" icon="cloud">
    Navegue e publique Skills no registro público.
  </Card>
  <Card title="Criando plugins" href="/pt-BR/plugins/building-plugins" icon="plug">
    Plugins podem distribuir Skills junto com as ferramentas que documentam.
  </Card>
</CardGroup>
