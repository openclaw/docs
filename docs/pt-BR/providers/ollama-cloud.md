---
read_when:
    - Você quer usar modelos Ollama hospedados sem um servidor Ollama local
    - Você precisa do ID, da chave ou do endpoint do provedor ollama-cloud
summary: Use o Ollama Cloud diretamente com o OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-12T00:20:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud é a API de modelos hospedada da Ollama. O provedor `ollama-cloud` a acessa
diretamente em `https://ollama.com` pela API nativa `/api/chat` da Ollama, sem
servidor Ollama local e sem aplicativo Ollama local conectado ao modo de nuvem. Use referências
de modelo como `ollama-cloud/kimi-k2.6`.

O OpenClaw registra `ollama-cloud` com seu próprio identificador de provedor para que
credenciais exclusivas da nuvem, descoberta dinâmica do catálogo e seleção de modelos não sejam misturadas com
um host `ollama` local. Para Ollama local, roteamento híbrido entre nuvem e ambiente local,
embeddings e detalhes de hosts personalizados, consulte [Ollama](/pt-BR/providers/ollama).

## Configuração

Crie uma chave de API do Ollama Cloud em [ollama.com/settings/keys](https://ollama.com/settings/keys) e execute:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Ou defina:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

A integração não interativa aceita a chave diretamente:

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

A integração define o modelo padrão como `ollama-cloud/kimi-k2.5:cloud`.

## Padrões

- Provedor: `ollama-cloud`
- URL base: `https://ollama.com`
- Variável de ambiente: `OLLAMA_API_KEY`
- Estilo da API: `/api/chat` nativa da Ollama
- Modelo padrão da integração: `ollama-cloud/kimi-k2.5:cloud`

## Quando escolher o Ollama Cloud

- Você quer modelos Ollama hospedados sem executar `ollama serve` localmente.
- Você quer o mesmo formato da API nativa de chat da Ollama que o OpenClaw usa para a Ollama
  local, mas direcionado a `https://ollama.com`.
- Você quer um caminho simples pela nuvem para modelos que já estão no catálogo
  hospedado da Ollama.
- Você não precisa baixar modelos localmente, controlar GPUs locais nem realizar inferência exclusiva pela LAN.

Use [Ollama](/pt-BR/providers/ollama) quando quiser roteamento somente local ou
entre nuvem e ambiente local por meio de um host Ollama conectado. Use um
provedor compatível com OpenAI quando precisar da semântica de `/v1/chat/completions`
ou de recursos específicos do provedor no estilo OpenAI.

## Modelos

O provedor exige uma chave de API; sem ela, permanece inativo. Com uma chave,
o OpenClaw descobre dinamicamente os modelos do Ollama Cloud no catálogo hospedado:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Os identificadores hospedados no catálogo dinâmico incluem `deepseek-v4-flash`, `glm-5`,
`gpt-oss:20b`, `kimi-k2.6` e `minimax-m2.7`. Quando a descoberta dinâmica não retorna
nada, o OpenClaw usa como alternativa as entradas incluídas `kimi-k2.5:cloud`,
`minimax-m2.7:cloud`, `glm-5.1:cloud` e `glm-5.2:cloud`.

Os identificadores de modelos são os do catálogo da nuvem, não nomes de downloads locais. Se o nome de um modelo funcionar em
um host Ollama local, mas não estiver presente no catálogo hospedado, use o provedor `ollama`
com esse host local.

## Teste em ambiente real

Para testes rápidos com chave de API do Ollama Cloud, direcione o teste em ambiente real da Ollama ao endpoint
hospedado e escolha um modelo do seu catálogo atual:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

O teste rápido na nuvem executa texto, fluxo nativo e pesquisa na web; defina
`OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` para ignorar a pesquisa na web. Ele ignora embeddings por
padrão para `https://ollama.com`, pois as chaves de API do Ollama Cloud podem não
autorizar `/api/embed`; force-os com `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`.

## Solução de problemas

- Erros `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY`: forneça uma
  chave de API de nuvem válida. O marcador local `ollama-local` serve apenas para hosts Ollama
  locais ou privados.
- Erros de modelo desconhecido: execute `openclaw models list --provider ollama-cloud` e
  copie exatamente o identificador do modelo hospedado.
- Problemas com chamadas de ferramentas ou JSON bruto em hosts Ollama personalizados: verifique se você está
  usando acidentalmente uma URL `/v1` compatível com OpenAI. As rotas da Ollama devem usar
  a URL base nativa sem o sufixo `/v1`.

## Conteúdo relacionado

- [Ollama](/pt-BR/providers/ollama)
- [Provedores de modelos](/pt-BR/concepts/model-providers)
- [Todos os provedores](/pt-BR/providers/index)
