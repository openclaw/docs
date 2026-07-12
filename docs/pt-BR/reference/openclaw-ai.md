---
read_when:
    - Você quer reutilizar os transportes de modelos do OpenClaw em outro aplicativo
    - Você está alterando packages/ai ou as portas do host de transporte de IA
    - Você está analisando o que a versão do OpenClaw publica no npm além do pacote raiz
summary: 'O pacote npm @openclaw/ai: transportes de modelos reutilizáveis, runtimes isolados e portas de política do host'
title: pacote @openclaw/ai
x-i18n:
    generated_at: "2026-07-12T15:36:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` é a forma de biblioteca publicável da camada de execução de
modelos do OpenClaw: contratos de mensagens/ferramentas/fluxos independentes de
provedor, validação, diagnósticos, fluxos de eventos, um registro de runtime
isolado e adaptadores carregados sob demanda para as oito famílias de APIs
integradas (Anthropic Messages, OpenAI Completions, OpenAI Responses, Azure
OpenAI Responses, ChatGPT/Codex Responses, Google Generative AI, Google Vertex,
Mistral Conversations).

Ela é publicada junto com o pacote raiz `openclaw` em cada versão, fixada na
mesma versão, com seu próprio `npm-shrinkwrap.json`, para que sua árvore de
dependências transitivas seja bloqueada no momento da instalação. A instalação
do `openclaw` instala automaticamente a versão correspondente de
`@openclaw/ai`; consumidores da biblioteca podem depender dela diretamente,
sem nenhum código da aplicação OpenClaw.

## Início rápido

```js
import { createLlmRuntime } from "@openclaw/ai";
import { registerBuiltInApiProviders } from "@openclaw/ai/providers";

const runtime = createLlmRuntime();
registerBuiltInApiProviders(runtime.registry);

const stream = runtime.streamSimple(model, { messages }, { apiKey });
for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}
const result = await stream.result();
```

Uma versão executável está disponível no repositório em `examples/ai-chat`.

## Contrato de design

- **Escopo por instância por padrão.** Importar o pacote não registra nada
  globalmente. `createApiRegistry()` / `createLlmRuntime()` retornam instâncias
  isoladas; `registerBuiltInApiProviders(registry)` habilita os transportes
  integrados em um registro. Os módulos de SDK dos provedores são carregados
  sob demanda no primeiro uso.
- **A política do host é injetada, não incluída no pacote.** A proteção do
  fetch de requisições (por exemplo, a política de SSRF), a ocultação de
  segredos no texto de reprodução dos resultados de ferramentas, os padrões
  de ferramentas estritas do OpenAI e o registro de diagnósticos são portas
  `AiTransportHost` configuradas com `configureAiTransportHost`. Os padrões da
  biblioteca são inertes; o OpenClaw instala suas implementações reais em sua
  fachada de fluxos.
- **Uma única identidade de fluxo de eventos.** `@openclaw/ai/event-stream` é
  o construtor canônico de `EventStream` compartilhado pelo núcleo do OpenClaw,
  pelo agent-core e por consumidores externos.
- **Os subcaminhos `internal/*` não são API.** Eles existem para a própria
  aplicação OpenClaw e não oferecem nenhuma garantia de semver.
- IDs de provedores, credenciais, catálogos de modelos, novas tentativas e
  failover continuam sendo responsabilidades da aplicação. O OpenClaw adiciona
  essas camadas ao redor deste pacote; o consumidor da biblioteca fornece
  diretamente um objeto `Model` e as opções.

## Exportações de subcaminhos

| Subcaminho       | Conteúdo                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | Contratos, `createApiRegistry`, `createLlmRuntime`, `configureAiTransportHost` |
| `./providers`    | `registerBuiltInApiProviders`, `resetApiProviders`                             |
| `./types`        | Tipos de modelo/mensagem/ferramenta/fluxo                                      |
| `./validation`   | Validação de argumentos de ferramentas                                         |
| `./diagnostics`  | Contratos de diagnóstico                                                       |
| `./event-stream` | Implementação compartilhada de `EventStream`                                   |
| `./internal/*`   | Interno ao OpenClaw, sem garantia de semver                                    |
