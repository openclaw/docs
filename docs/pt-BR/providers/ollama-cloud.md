---
read_when:
    - Você quer usar modelos Ollama hospedados sem um servidor Ollama local
    - Você precisa do id, da chave ou do endpoint do provedor ollama-cloud
summary: Use o Ollama Cloud diretamente com o OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-06-27T18:05:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24b937085de1ed805b7bb0fe76a4197030bd45cd989ede8030386f3c721b9763
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud é a API de modelos hospedados da Ollama. Ela permite que o OpenClaw chame modelos hospedados pela Ollama diretamente, sem instalar um servidor Ollama local nem conectar um aplicativo Ollama local no modo de nuvem. Use o id de provedor `ollama-cloud` e referências de modelo como `ollama-cloud/kimi-k2.6`.

Esta página é para roteamento direto somente pela nuvem. O provedor usa o estilo nativo `/api/chat` da Ollama, não a rota compatível com OpenAI `/v1`. O OpenClaw o registra como um id de provedor separado para que credenciais somente de nuvem, descoberta ao vivo do catálogo e seleção de modelo não sejam misturadas com um host `ollama` local.

Use esta página quando quiser roteamento somente pela nuvem. Para Ollama local, roteamento híbrido nuvem mais local, embeddings e detalhes de host personalizado, consulte [Ollama](/pt-BR/providers/ollama).

## Configuração

Crie uma chave de API do Ollama Cloud em [ollama.com/settings/keys](https://ollama.com/settings/keys) e execute:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Ou defina:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

## Padrões

- Provedor: `ollama-cloud`
- URL base: `https://ollama.com`
- Variável de ambiente: `OLLAMA_API_KEY`
- Estilo de API: `/api/chat` nativo da Ollama
- Modelo de exemplo: `ollama-cloud/kimi-k2.6`

## Quando escolher Ollama Cloud

- Você quer modelos Ollama hospedados sem executar `ollama serve` localmente.
- Você quer o mesmo formato nativo da API de chat da Ollama que o OpenClaw usa para Ollama local, mas apontado para `https://ollama.com`.
- Você quer um caminho simples pela nuvem para modelos que já estão no catálogo hospedado da Ollama.
- Você não precisa de pulls de modelos locais, controle de GPU local ou inferência somente pela LAN.

Use [Ollama](/pt-BR/providers/ollama) quando quiser roteamento somente local ou nuvem mais local por meio de um host Ollama conectado. Use um provedor compatível com OpenAI quando precisar de semântica de `/v1/chat/completions` ou recursos específicos de provedor no estilo OpenAI.

## Modelos

O OpenClaw descobre modelos do Ollama Cloud a partir do catálogo hospedado ao vivo. Ids hospedados comumente disponíveis incluem:

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k2.6`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m2.7`
- `ollama-cloud/glm-5`

Use um id de modelo do seu catálogo hospedado atual:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Ids de modelo são ids do catálogo em nuvem, não nomes de pull locais. Se um nome de modelo funciona em um host Ollama local, mas está ausente do catálogo hospedado, use o provedor `ollama` com esse host local.

## Teste ao vivo

Para testes rápidos de validação com chave de API do Ollama Cloud, aponte o teste ao vivo da Ollama para o endpoint hospedado e escolha um modelo do seu catálogo atual:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

A validação rápida na nuvem executa texto, stream nativo e busca na web. Ela ignora embeddings por padrão para `https://ollama.com` porque chaves de API do Ollama Cloud podem não autorizar `/api/embed`.

## Solução de problemas

- Erros `Set OLLAMA_API_KEY`: forneça uma chave de API real da nuvem. O marcador local `ollama-local` é apenas para hosts Ollama locais ou privados.
- Erros de modelo desconhecido: execute `openclaw models list --provider ollama-cloud` e copie exatamente o id do modelo hospedado.
- Problemas de chamadas de ferramenta ou JSON bruto em hosts Ollama personalizados: verifique se você está usando acidentalmente uma URL `/v1` compatível com OpenAI. Rotas da Ollama devem usar a URL base nativa sem sufixo `/v1`.

## Relacionado

- [Ollama](/pt-BR/providers/ollama)
- [Provedores de modelos](/pt-BR/concepts/model-providers)
- [Todos os provedores](/pt-BR/providers/index)
