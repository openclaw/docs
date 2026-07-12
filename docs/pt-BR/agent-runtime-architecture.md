---
summary: 'Como o OpenClaw estrutura o runtime de agente integrado: organização do código, limites, manifestos de recursos e seleção de runtime.'
title: Arquitetura do runtime do agente
x-i18n:
    generated_at: "2026-07-12T14:52:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 071a0cb076230ce02f2c2c1c21971379cf617f24faa8a9733570aae30a062019
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw é responsável pelo runtime de agente integrado. O código do runtime fica em `src/agents/`, o transporte de modelos/provedores fica em `src/llm/`, e os contratos voltados a plugins são expostos por meio dos barrels `openclaw/plugin-sdk/*`.

## Estrutura do runtime

| Caminho                             | Responsável por                                                                                                                                                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | Loop de tentativas integrado (`run.ts`, `run/`), seleção de modelo e normalização de provedor (`model*.ts`), parâmetros de solicitação por provedor (`extra-params.*`), Compaction e integração de transcrição e sessão.             |
| `src/agents/sessions/`              | Persistência de sessões (`session-manager.ts`), descoberta de recursos (`package-manager.ts`, `resource-loader.ts`), carregamento de `extensions` durante a sessão, modelos de prompt, Skills, temas e renderizadores de ferramentas baseados em TUI (`tools/`). |
| `packages/agent-core/`              | Núcleo de agente reutilizável (`@openclaw/agent-core`): loop do agente, tipos de harness, mensagens, auxiliares de Compaction, modelos de prompt, Skills e contratos de armazenamento de sessões.                                  |
| `src/agents/runtime/`               | Fachada do OpenClaw que conecta `@openclaw/agent-core` ao runtime de LLM do SDK de plugins e o reexporta junto com utilitários locais de proxy.                                                                                   |
| `src/agents/agent-tools*.ts`        | Definições de ferramentas mantidas pelo OpenClaw, esquemas de parâmetros, política de ferramentas, adaptadores anteriores e posteriores às chamadas de ferramentas e ferramentas de edição do host/sandbox.                     |
| `src/agents/agent-hooks/`           | Hooks integrados do runtime: proteção de Compaction, instruções de Compaction e poda de contexto.                                                                                                                                |
| `src/agents/harness/`               | Registro, política de seleção e ciclo de vida de harnesses integrados e registrados por plugins.                                                                                                                                 |
| `src/llm/`                          | Registro de modelos/provedores, auxiliares de transporte e implementações de streaming específicas de provedores (`src/llm/providers/`).                                                                                        |

## Limites

O núcleo chama o runtime integrado por meio dos módulos do OpenClaw e dos barrels do SDK; não restam pacotes externos de frameworks de agentes. Os plugins usam pontos de entrada documentados de `openclaw/plugin-sdk/*` e não importam componentes internos de `src/**`.

`@earendil-works/pi-tui` continua sendo uma dependência de terceiros: um kit de ferramentas de componentes para terminal usado pela TUI local e pelos renderizadores de ferramentas de sessão. Internalizá-lo exigiria um esforço separado de incorporação do código do fornecedor.

## Manifestos

Os pacotes de recursos declaram recursos do OpenClaw nos metadados de `package.json`. As entradas são caminhos de arquivos ou globs relativos à raiz do pacote:

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

Os tipos de recursos não listados em um manifesto recorrem à descoberta dos diretórios convencionais `extensions/`, `skills/`, `prompts/` e `themes/`.

## Seleção do runtime

- O id do runtime integrado é `openclaw`. O alias legado `pi` é normalizado para `openclaw`; `codex-app-server` é normalizado para `codex`.
- Os harnesses de plugins registram ids de runtime adicionais (por exemplo, `codex`).
- A política de runtime é a configuração `agentRuntime.id` no escopo do modelo/provedor (a entrada do modelo tem precedência sobre a entrada do provedor). Quando não definido ou definido como `default`, o valor é resolvido como `auto`.
- `auto` seleciona um harness de plugin registrado que seja compatível com a rota efetiva do provedor; caso contrário, seleciona o runtime integrado do OpenClaw. Um prefixo de provedor ou modelo, por si só, nunca seleciona um harness.
- A OpenAI pode selecionar `codex` implicitamente somente para uma rota oficial HTTPS exata de Platform Responses ou ChatGPT Responses, sem substituição de solicitação definida pelo autor. Adaptadores de Completions, endpoints personalizados e rotas com comportamento de solicitação definido pelo autor permanecem em `openclaw`; endpoints HTTP oficiais sem criptografia são rejeitados. Consulte [runtime de agente implícito da OpenAI](/pt-BR/providers/openai#implicit-agent-runtime).

## Relacionado

- [Fluxo de trabalho do runtime de agente do OpenClaw](/pt-BR/openclaw-agent-runtime)
- [Runtimes de agentes](/pt-BR/concepts/agent-runtimes)
