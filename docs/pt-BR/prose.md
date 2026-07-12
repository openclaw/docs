---
read_when:
    - Você quer executar ou escrever arquivos de fluxo de trabalho `.prose`
    - Você quer habilitar o plugin OpenProse
    - Você precisa entender como o OpenProse se relaciona com os recursos fundamentais do OpenClaw
sidebarTitle: OpenProse
summary: OpenProse é um formato de fluxo de trabalho centrado em Markdown para sessões de IA com múltiplos agentes. No OpenClaw, ele é fornecido como um Plugin com um comando de barra `/prose` e um pacote de Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T15:31:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse é um formato de fluxo de trabalho portátil, baseado principalmente em Markdown, para orquestrar sessões de IA. No OpenClaw, ele é fornecido como um plugin que instala um pacote de Skills do OpenProse e um comando de barra `/prose`. Os programas ficam em arquivos `.prose` e podem iniciar vários subagentes com fluxo de controle explícito.

<CardGroup cols={3}>
  <Card title="Instalar" icon="download" href="#install">
    Ative o plugin OpenProse e reinicie o Gateway.
  </Card>
  <Card title="Executar um programa" icon="play" href="#slash-command">
    Use `/prose run` para executar um arquivo `.prose` ou um programa remoto.
  </Card>
  <Card title="Escrever programas" icon="pencil" href="#example-parallel-research-and-synthesis">
    Crie fluxos de trabalho multiagente com etapas paralelas e sequenciais.
  </Card>
</CardGroup>

## Instalação

<Steps>
  <Step title="Ative o plugin">
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

    Você deverá ver `open-prose` como ativado. O comando de Skill `/prose` agora está
    disponível no chat.

  </Step>
</Steps>

A partir de um checkout do repositório, você pode instalar o plugin diretamente:
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

Execuções remotas de nível superior são explícitas. Importações remotas dentro de um programa `.prose` são dependências de código transitivas: antes de o OpenProse obter qualquer destino `use` remoto, ele exibe a lista de importações resolvida e exige que o operador responda exatamente `approve remote prose imports` para essa execução.

## O que ele pode fazer

- Pesquisa e síntese multiagente com paralelismo explícito.
- Fluxos de trabalho repetíveis e seguros por meio de aprovação (revisão de código, triagem de incidentes, pipelines de conteúdo).
- Programas `.prose` reutilizáveis que você pode executar nos runtimes de agentes compatíveis.

## Exemplo: pesquisa e síntese paralelas

```prose
# Pesquisa + síntese com dois agentes executados em paralelo.

input topic: "O que devemos pesquisar?"

agent researcher:
  model: sonnet
  prompt: "Você pesquisa minuciosamente e cita fontes."

agent writer:
  model: opus
  prompt: "Você escreve um resumo conciso."

parallel:
  findings = session: researcher
    prompt: "Pesquise {topic}."
  draft = session: writer
    prompt: "Resuma {topic}."

session "Combine as descobertas + o rascunho em uma resposta final."
  context: { findings, draft }
```

## Mapeamento do runtime do OpenClaw

Os programas OpenProse são mapeados para primitivas do OpenClaw:

| Conceito do OpenProse       | Ferramenta do OpenClaw                            |
| --------------------------- | ------------------------------------------------- |
| Iniciar sessão/ferramenta Task | `sessions_spawn`                              |
| Leitura/gravação de arquivos | `read` / `write`                                |
| Busca na web                | `web_fetch` (`exec` + curl quando POST é necessário) |

<Warning>
  Se a lista de ferramentas permitidas bloquear `sessions_spawn`, `read`, `write` ou
  `web_fetch`, os programas OpenProse falharão. Verifique a
  [configuração da lista de ferramentas permitidas](/pt-BR/gateway/config-tools).
</Warning>

## Locais dos arquivos

O OpenProse mantém o estado em `.prose/` no seu espaço de trabalho:

```text
.prose/
├── .env                      # configuração (chave=valor), por exemplo, OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # cópia do programa em execução
│       ├── state.md          # estado da execução
│       ├── bindings/
│       ├── imports/          # execuções aninhadas de programas remotos
│       └── agents/
└── agents/                   # agentes persistentes com escopo de projeto
```

Os agentes persistentes no nível do usuário (compartilhados entre projetos) ficam em:

```text
~/.prose/agents/
```

## Backends de estado

<AccordionGroup>
  <Accordion title="sistema de arquivos (padrão)">
    O estado é gravado em `.prose/runs/...` no espaço de trabalho. Nenhuma
    dependência adicional é necessária.
  </Accordion>
  <Accordion title="no contexto">
    Estado transitório mantido na janela de contexto; selecione com `--in-context`.
    Adequado para programas pequenos e de curta duração.
  </Accordion>
  <Accordion title="sqlite (experimental)">
    Selecione com `--state=sqlite`. Requer o binário `sqlite3` no `PATH`
    (recorre ao sistema de arquivos quando ausente); o estado fica em
    `.prose/runs/{id}/state.db`.
  </Accordion>
  <Accordion title="postgres (experimental)">
    Selecione com `--state=postgres`. Requer `psql` e uma string de conexão em
    `OPENPROSE_POSTGRES_URL` (defina-a em `.prose/.env`).

    <Warning>
      As credenciais do Postgres são incluídas nos logs dos subagentes. Use um banco de dados
      dedicado e com privilégios mínimos.
    </Warning>

  </Accordion>
</AccordionGroup>

## Segurança

Trate os arquivos `.prose` como código. Revise-os antes da execução, incluindo importações `use` remotas. As solicitações de nível superior `/prose run https://...` são explícitas, mas importações remotas transitivas exigem aprovação por execução antes de serem obtidas ou executadas. Use listas de ferramentas permitidas e controles de aprovação do OpenClaw para controlar efeitos colaterais. Para fluxos de trabalho determinísticos e controlados por aprovação, compare com o [Lobster](/pt-BR/tools/lobster).

## Relacionados

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
    Todos os comandos de chat disponíveis, incluindo /prose.
  </Card>
</CardGroup>

Site oficial: [https://www.prose.md](https://www.prose.md)
