---
read_when:
    - Você quer executar ou escrever arquivos de fluxo de trabalho `.prose`
    - Você quer habilitar o plugin OpenProse
    - Você precisa entender como o OpenProse é mapeado para os elementos fundamentais do OpenClaw
sidebarTitle: OpenProse
summary: OpenProse é um formato de fluxo de trabalho baseado prioritariamente em Markdown para sessões de IA com múltiplos agentes. No OpenClaw, ele é fornecido como um Plugin com o comando de barra /prose e um pacote de Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T00:17:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse é um formato de fluxo de trabalho portátil, baseado prioritariamente em Markdown, para orquestrar sessões de IA. No OpenClaw, ele é fornecido como um Plugin que instala um pacote de Skills do OpenProse e um comando de barra `/prose`. Os programas ficam em arquivos `.prose` e podem iniciar vários subagentes com fluxo de controle explícito.

<CardGroup cols={3}>
  <Card title="Instalar" icon="download" href="#install">
    Ative o Plugin OpenProse e reinicie o Gateway.
  </Card>
  <Card title="Executar um programa" icon="play" href="#slash-command">
    Use `/prose run` para executar um arquivo `.prose` ou um programa remoto.
  </Card>
  <Card title="Criar programas" icon="pencil" href="#example-parallel-research-and-synthesis">
    Crie fluxos de trabalho multiagente com etapas paralelas e sequenciais.
  </Card>
</CardGroup>

## Instalação

<Steps>
  <Step title="Ative o Plugin">
    O OpenProse vem incluído, mas fica desativado por padrão. Ative-o:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Reinicie o Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Verifique">
    ```bash
    openclaw plugins list | grep prose
    ```

    Você deverá ver `open-prose` como ativado. O comando de Skill `/prose` agora está disponível no chat.

  </Step>
</Steps>

Em um checkout do repositório, você pode instalar o Plugin diretamente:
`openclaw plugins install ./extensions/open-prose`

## Comando de barra

O OpenProse registra `/prose` como um comando de Skill que pode ser invocado pelo usuário:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` é resolvido como `https://p.prose.md/<handle>/<slug>`.
URLs diretas são obtidas sem alterações usando a ferramenta `web_fetch`.

As execuções remotas de nível superior são explícitas. As importações remotas dentro de um programa `.prose` são dependências transitivas de código: antes de o OpenProse obter qualquer destino remoto de `use`, ele mostra a lista de importações resolvidas e exige que o operador responda exatamente `approve remote prose imports` para essa execução.

## O que ele pode fazer

- Pesquisa e síntese multiagente com paralelismo explícito.
- Fluxos de trabalho repetíveis e seguros mediante aprovação (revisão de código, triagem de incidentes e pipelines de conteúdo).
- Programas `.prose` reutilizáveis que você pode executar nos runtimes de agentes compatíveis.

## Exemplo: pesquisa e síntese paralelas

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
  context: { findings, draft }
```

## Mapeamento para o runtime do OpenClaw

Os programas OpenProse são mapeados para primitivas do OpenClaw:

| Conceito do OpenProse      | Ferramenta do OpenClaw                           |
| -------------------------- | ------------------------------------------------ |
| Iniciar sessão/ferramenta de tarefa | `sessions_spawn`                         |
| Leitura/gravação de arquivos | `read` / `write`                               |
| Obtenção de conteúdo da web | `web_fetch` (`exec` + curl quando POST é necessário) |

<Warning>
  Se sua lista de permissões de ferramentas bloquear `sessions_spawn`, `read`, `write` ou `web_fetch`, os programas OpenProse falharão. Verifique sua [configuração da lista de permissões de ferramentas](/pt-BR/gateway/config-tools).
</Warning>

## Locais dos arquivos

O OpenProse mantém o estado em `.prose/` no seu espaço de trabalho:

```text
.prose/
├── .env                      # config (key=value), e.g. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copy of the running program
│       ├── state.md          # execution state
│       ├── bindings/
│       ├── imports/          # nested remote program runs
│       └── agents/
└── agents/                   # project-scoped persistent agents
```

Os agentes persistentes no nível do usuário (compartilhados entre projetos) ficam em:

```text
~/.prose/agents/
```

## Backends de estado

<AccordionGroup>
  <Accordion title="sistema de arquivos (padrão)">
    O estado é gravado em `.prose/runs/...` no espaço de trabalho. Nenhuma dependência adicional é necessária.
  </Accordion>
  <Accordion title="no contexto">
    Estado transitório mantido na janela de contexto; selecione com `--in-context`.
    Adequado para programas pequenos e de curta duração.
  </Accordion>
  <Accordion title="sqlite (experimental)">
    Selecione com `--state=sqlite`. Requer o binário `sqlite3` no `PATH`
    (recorre ao sistema de arquivos quando ele não está disponível); o estado é armazenado em
    `.prose/runs/{id}/state.db`.
  </Accordion>
  <Accordion title="postgres (experimental)">
    Selecione com `--state=postgres`. Requer `psql` e uma string de conexão em
    `OPENPROSE_POSTGRES_URL` (defina-a em `.prose/.env`).

    <Warning>
      As credenciais do Postgres são incluídas nos logs dos subagentes. Use um banco de dados dedicado com privilégios mínimos.
    </Warning>

  </Accordion>
</AccordionGroup>

## Segurança

Trate arquivos `.prose` como código. Revise-os antes da execução, incluindo as importações remotas de `use`. As solicitações `/prose run https://...` de nível superior são explícitas, mas as importações remotas transitivas exigem aprovação a cada execução antes de serem obtidas ou executadas. Use as listas de permissões de ferramentas e os controles de aprovação do OpenClaw para controlar efeitos colaterais. Para fluxos de trabalho determinísticos e sujeitos a aprovação, compare com o [Lobster](/pt-BR/tools/lobster).

## Conteúdo relacionado

<CardGroup cols={2}>
  <Card title="Referência de Skills" href="/pt-BR/tools/skills" icon="puzzle-piece">
    Como o pacote de Skills do OpenProse é carregado e quais controles se aplicam.
  </Card>
  <Card title="Subagentes" href="/pt-BR/tools/subagents" icon="users">
    A camada nativa de coordenação multiagente do OpenClaw.
  </Card>
  <Card title="Conversão de texto em fala" href="/pt-BR/tools/tts" icon="volume-high">
    Adicione saída de áudio aos seus fluxos de trabalho.
  </Card>
  <Card title="Comandos de barra" href="/pt-BR/tools/slash-commands" icon="terminal">
    Todos os comandos de chat disponíveis, incluindo `/prose`.
  </Card>
</CardGroup>

Site oficial: [https://www.prose.md](https://www.prose.md)
