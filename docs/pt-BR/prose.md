---
read_when:
- Você quer executar ou escrever workflows `.prose`
- You want to enable the OpenProse plugin
- Você precisa entender o armazenamento de estado
summary: 'OpenProse: workflows `.prose`, comandos de barra e estado no OpenClaw'
title: OpenProse
x-i18n:
  generated_at: '2026-04-24T06:06:04Z'
  refreshed_at: '2026-04-28T05:14:37Z'
  model: gpt-5.4
  provider: openai
  source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
  source_path: prose.md
  workflow: 15
---

O OpenProse é um formato portátil de workflow, orientado a Markdown, para orquestrar sessões de IA. No OpenClaw, ele é distribuído como um plugin que instala um pacote de Skills do OpenProse junto com um comando de barra `/prose`. Os programas ficam em arquivos `.prose` e podem gerar vários subagentes com controle explícito de fluxo.

Site oficial: [https://www.prose.md](https://www.prose.md)

## O que ele pode fazer

- Pesquisa + síntese com vários agentes e paralelismo explícito.
- Workflows repetíveis e seguros para aprovação (revisão de código, triagem de incidentes, pipelines de conteúdo).
- Programas `.prose` reutilizáveis que você pode executar em runtimes de agente compatíveis.

## Instalar + habilitar

Plugins integrados são desabilitados por padrão. Habilite o OpenProse:

```bash
openclaw plugins enable open-prose
```

Reinicie o Gateway após habilitar o plugin.

Checkout local/dev: `openclaw plugins install ./path/to/local/open-prose-plugin`

Documentação relacionada: [Plugins](/pt-BR/tools/plugin), [Manifesto de Plugin](/pt-BR/plugins/manifest), [Skills](/pt-BR/tools/skills).

## Comando de barra

O OpenProse registra `/prose` como um comando de Skill invocável pelo usuário. Ele faz o roteamento para as instruções da VM OpenProse e usa tools do OpenClaw internamente.

Comandos comuns:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Exemplo: um arquivo `.prose` simples

```prose
# Pesquisa + síntese com dois agentes executando em paralelo.

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

## Locais de arquivo

O OpenProse mantém o estado em `.prose/` no seu workspace:

```
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

Agentes persistentes em nível de usuário ficam em:

```
~/.prose/agents/
```

## Modos de estado

O OpenProse oferece suporte a vários backends de estado:

- **filesystem** (padrão): `.prose/runs/...`
- **in-context**: transitório, para programas pequenos
- **sqlite** (experimental): requer binário `sqlite3`
- **postgres** (experimental): requer `psql` e uma string de conexão

Observações:

- sqlite/postgres são opt-in e experimentais.
- Credenciais de postgres fluem para logs de subagente; use um banco de dados dedicado com privilégios mínimos.

## Programas remotos

`/prose run <handle/slug>` resolve para `https://p.prose.md/<handle>/<slug>`.
URLs diretas são buscadas como estão. Isso usa a tool `web_fetch` (ou `exec` para POST).

## Mapeamento de runtime do OpenClaw

Programas OpenProse são mapeados para primitivas do OpenClaw:

| Conceito do OpenProse      | Tool do OpenClaw |
| -------------------------- | ---------------- |
| Gerar sessão / Task tool   | `sessions_spawn` |
| Leitura/gravação de arquivo | `read` / `write` |
| Busca web                  | `web_fetch`      |

Se sua lista de permissões de tools bloquear essas tools, programas OpenProse falharão. Consulte [Configuração de Skills](/pt-BR/tools/skills-config).

## Segurança + aprovações

Trate arquivos `.prose` como código. Revise antes de executar. Use listas de permissões de tools e gates de aprovação do OpenClaw para controlar efeitos colaterais.

Para workflows determinísticos com gate de aprovação, compare com [Lobster](/pt-BR/tools/lobster).

## Relacionado

- [Texto para fala](/pt-BR/tools/tts)
- [Formatação Markdown](/pt-BR/concepts/markdown-formatting)
