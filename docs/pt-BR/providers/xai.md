---
read_when:
    - Você quer usar models Grok no OpenClaw
    - Você está configurando auth do xAI ou ids de model
summary: Use models Grok do xAI no OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-06T03:11:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64bc899655427cc10bdc759171c7d1ec25ad9f1e4f9d803f1553d3d586c6d71d
    source_path: providers/xai.md
    workflow: 15
---

# xAI

O OpenClaw inclui um plugin de provedor `xai` integrado para models Grok.

## Configuração

1. Crie uma chave de API no console do xAI.
2. Defina `XAI_API_KEY` ou execute:

```bash
openclaw onboard --auth-choice xai-api-key
```

3. Escolha um model como:

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

Agora, o OpenClaw usa a xAI Responses API como transporte xAI integrado. A mesma
`XAI_API_KEY` também pode fornecer `web_search` com suporte de Grok, `x_search` nativo
e `code_execution` remoto.
Se você armazenar uma chave xAI em `plugins.entries.xai.config.webSearch.apiKey`,
o provedor de model xAI integrado agora também reutilizará essa chave como fallback.
O ajuste de `code_execution` fica em `plugins.entries.xai.config.codeExecution`.

## Catálogo atual de models integrados

O OpenClaw agora inclui estas famílias de model xAI prontas para uso:

- `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`
- `grok-4`, `grok-4-0709`
- `grok-4-fast`, `grok-4-fast-non-reasoning`
- `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`
- `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`
- `grok-code-fast-1`

O plugin também resolve por encaminhamento ids mais novos de `grok-4*` e `grok-code-fast*` quando
eles seguem o mesmo formato de API.

Observações sobre models rápidos:

- `grok-4-fast`, `grok-4-1-fast` e as variantes `grok-4.20-beta-*` são as
  referências Grok atuais com suporte a imagem no catálogo integrado.
- `/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
  reescreve requisições nativas xAI da seguinte forma:
  - `grok-3` -> `grok-3-fast`
  - `grok-3-mini` -> `grok-3-mini-fast`
  - `grok-4` -> `grok-4-fast`
  - `grok-4-0709` -> `grok-4-fast`

Aliases legados de compatibilidade ainda são normalizados para os ids canônicos integrados. Por
exemplo:

- `grok-4-fast-reasoning` -> `grok-4-fast`
- `grok-4-1-fast-reasoning` -> `grok-4-1-fast`
- `grok-4.20-reasoning` -> `grok-4.20-beta-latest-reasoning`
- `grok-4.20-non-reasoning` -> `grok-4.20-beta-latest-non-reasoning`

## Web search

O provedor integrado de web-search `grok` também usa `XAI_API_KEY`:

```bash
openclaw config set tools.web.search.provider grok
```

## Geração de vídeo

O plugin integrado `xai` também registra geração de vídeo por meio da
tool compartilhada `video_generate`.

- Model de vídeo padrão: `xai/grok-imagine-video`
- Modos: texto para vídeo, imagem para vídeo e fluxos remotos de edição/extensão de vídeo
- Suporta `aspectRatio` e `resolution`
- Limite atual: buffers de vídeo locais não são aceitos; use URLs remotas `http(s)`
  para entradas de referência/edição de vídeo

Para usar xAI como provedor de vídeo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "xai/grok-imagine-video",
      },
    },
  },
}
```

Consulte [Video Generation](/tools/video-generation) para ver os parâmetros
compartilhados da tool, a seleção de provedor e o comportamento de failover.

## Limites conhecidos

- Hoje, a auth é somente por chave de API. Ainda não existe fluxo xAI OAuth/código de dispositivo no OpenClaw.
- `grok-4.20-multi-agent-experimental-beta-0304` não é compatível no caminho normal do provedor xAI porque exige uma superfície de API upstream diferente do transporte xAI padrão do OpenClaw.

## Observações

- O OpenClaw aplica automaticamente correções de compatibilidade específicas do xAI para schema de tool e chamadas de tool no caminho compartilhado do runner.
- Requisições nativas xAI usam `tool_stream: true` por padrão. Defina
  `agents.defaults.models["xai/<model>"].params.tool_stream` como `false` para
  desativá-lo.
- O wrapper xAI integrado remove flags estritas de schema de tool e
  chaves de payload de reasoning não compatíveis antes de enviar requisições nativas xAI.
- `web_search`, `x_search` e `code_execution` são expostos como tools do OpenClaw. O OpenClaw ativa o built-in específico do xAI de que precisa dentro de cada requisição de tool, em vez de anexar todas as tools nativas a cada turno de chat.
- `x_search` e `code_execution` pertencem ao plugin xAI integrado, e não são codificados diretamente no runtime de model do core.
- `code_execution` é execução remota em sandbox do xAI, não [`exec`](/pt-BR/tools/exec) local.
- Para a visão geral mais ampla de provedores, consulte [Model providers](/pt-BR/providers/index).
