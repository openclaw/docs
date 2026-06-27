---
read_when:
    - Você quer executar ou escrever arquivos de fluxo de trabalho .prose
    - Você quer habilitar o plugin OpenProse
    - Você precisa entender como o OpenProse mapeia para primitivas do OpenClaw
sidebarTitle: OpenProse
summary: OpenProse é um formato de workflow baseado primeiro em Markdown para sessões de IA multiagente. No OpenClaw, ele é distribuído como um plugin com um comando de barra /prose e um pacote de Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-06-27T18:01:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse é um formato de fluxo de trabalho portátil, centrado em markdown, para orquestrar
sessões de IA. No OpenClaw, ele é distribuído como um Plugin que instala um pacote de Skills
do OpenProse e um comando de barra `/prose`. Os programas ficam em arquivos `.prose` e podem
gerar vários subagentes com fluxo de controle explícito.

<CardGroup cols={3}>
  <Card title="Install" icon="download" href="#install">
    Habilite o Plugin OpenProse e reinicie o Gateway.
  </Card>
  <Card title="Run a program" icon="play" href="#slash-command">
    Use `/prose run` para executar um arquivo `.prose` ou programa remoto.
  </Card>
  <Card title="Write programs" icon="pencil" href="#example">
    Crie fluxos de trabalho multiagente com etapas paralelas e sequenciais.
  </Card>
</CardGroup>

## Instalação

<Steps>
  <Step title="Enable the plugin">
    Plugins incluídos vêm desabilitados por padrão. Habilite o OpenProse:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Verify">
    ```bash
    openclaw plugins list | grep prose
    ```

    Você deve ver `open-prose` como habilitado. O comando de Skill `/prose` agora está
    disponível no chat.

  </Step>
</Steps>

Para um checkout local: `openclaw plugins install ./path/to/local/open-prose-plugin`

## Comando de barra

O OpenProse registra `/prose` como um comando de Skill invocável pelo usuário:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` resolve para `https://p.prose.md/<handle>/<slug>`.
URLs diretas são buscadas como estão usando a ferramenta `web_fetch`.

Execuções remotas de nível superior são explícitas. Importações remotas dentro de um programa `.prose` são
dependências transitivas de código: antes que o OpenProse busque qualquer destino remoto de `use`,
ele mostra a lista de importações resolvida e exige que o operador responda exatamente
`approve remote prose imports` para aquela execução.

## O que ele pode fazer

- Pesquisa e síntese multiagente com paralelismo explícito.
- Fluxos de trabalho repetíveis e seguros por aprovação (revisão de código, triagem de incidentes, pipelines de conteúdo).
- Programas `.prose` reutilizáveis que você pode executar em runtimes de agentes compatíveis.

## Exemplo: pesquisa paralela e síntese

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

## Mapeamento do runtime do OpenClaw

Programas OpenProse são mapeados para primitivas do OpenClaw:

| Conceito do OpenProse     | Ferramenta do OpenClaw |
| ------------------------- | ---------------------- |
| Gerar sessão / ferramenta Task | `sessions_spawn` |
| Leitura / escrita de arquivo | `read` / `write` |
| Busca na web              | `web_fetch`            |

<Warning>
  Se sua lista de permissões de ferramentas bloquear `sessions_spawn`, `read`, `write` ou
  `web_fetch`, os programas OpenProse falharão. Confira sua
  [configuração da lista de permissões de ferramentas](/pt-BR/gateway/config-tools).
</Warning>

## Locais dos arquivos

O OpenProse mantém o estado em `.prose/` no seu workspace:

```text
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Agentes persistentes no nível do usuário ficam em:

```text
~/.prose/agents/
```

## Backends de estado

<AccordionGroup>
  <Accordion title="filesystem (default)">
    O estado é gravado em `.prose/runs/...` no workspace. Nenhuma dependência
    extra é necessária.
  </Accordion>
  <Accordion title="in-context">
    Estado transitório mantido na janela de contexto. Adequado para programas pequenos e de curta duração.
  </Accordion>
  <Accordion title="sqlite (experimental)">
    Requer o binário `sqlite3` no `PATH`.
  </Accordion>
  <Accordion title="postgres (experimental)">
    Requer `psql` e uma string de conexão.

    <Warning>
      Credenciais do Postgres fluem para logs de subagentes. Use um banco de dados dedicado
      e com privilégios mínimos.
    </Warning>

  </Accordion>
</AccordionGroup>

## Segurança

Trate arquivos `.prose` como código. Revise-os antes de executar, incluindo importações remotas
`use`. Solicitações de nível superior `/prose run https://...` são explícitas, mas
importações remotas transitivas exigem aprovação por execução antes de serem buscadas ou
executadas. Use listas de permissões de ferramentas e portões de aprovação do OpenClaw para controlar
efeitos colaterais. Para fluxos de trabalho determinísticos com aprovação obrigatória, compare com
[Lobster](/pt-BR/tools/lobster).

## Relacionados

<CardGroup cols={2}>
  <Card title="Skills reference" href="/pt-BR/tools/skills" icon="puzzle-piece">
    Como o pacote de Skills do OpenProse é carregado e quais portões se aplicam.
  </Card>
  <Card title="Subagents" href="/pt-BR/tools/subagents" icon="users">
    A camada nativa de coordenação multiagente do OpenClaw.
  </Card>
  <Card title="Text-to-speech" href="/pt-BR/tools/tts" icon="volume-high">
    Adicione saída de áudio aos seus fluxos de trabalho.
  </Card>
  <Card title="Slash commands" href="/pt-BR/tools/slash-commands" icon="terminal">
    Todos os comandos de chat disponíveis, incluindo /prose.
  </Card>
</CardGroup>

Site oficial: [https://www.prose.md](https://www.prose.md)
