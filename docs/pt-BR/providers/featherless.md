---
read_when:
    - Você quer usar a Featherless AI com o OpenClaw
    - Você precisa da variável de ambiente da chave da API Featherless ou do formato de referência do modelo
summary: Configuração do Featherless AI, seleção de modelos e chamadas de ferramentas
title: Featherless AI
x-i18n:
    generated_at: "2026-07-12T00:18:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9112f7e65b4089bf96933c632d0b62f7fb87d42998d985ca85eb92dc392636b6
    source_path: providers/featherless.md
    workflow: 16
---

[Featherless AI](https://featherless.ai) disponibiliza modelos abertos por meio de uma
API compatível com a OpenAI. O OpenClaw instala o Featherless como um Plugin
oficial de provedor externo e mantém o catálogo integrado enxuto, ao mesmo tempo
que aceita IDs exatos de modelos do Featherless em tempo de execução.

| Propriedade                  | Valor                                    |
| ---------------------------- | ---------------------------------------- |
| ID do provedor               | `featherless`                            |
| Pacote                       | `@openclaw/featherless-provider`         |
| Variável de ambiente de autenticação | `FEATHERLESS_API_KEY`             |
| Flag de integração inicial   | `--auth-choice featherless-api-key`      |
| Flag direta da CLI           | `--featherless-api-key <key>`            |
| API                          | Compatível com a OpenAI (`openai-completions`) |
| URL base                     | `https://api.featherless.ai/v1`          |
| Modelo padrão                | `featherless/Qwen/Qwen3-32B`             |

## Configuração

Instale o Plugin e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/featherless-provider
openclaw gateway restart
```

Execute a integração inicial:

```bash
openclaw onboard --auth-choice featherless-api-key
```

Para uma configuração não interativa:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice featherless-api-key \
  --featherless-api-key "$FEATHERLESS_API_KEY"
```

Ou disponibilize a chave ao processo do Gateway:

```bash
export FEATHERLESS_API_KEY="<your-featherless-api-key>" # pragma: allowlist secret
```

Verifique o provedor:

```bash
openclaw models list --provider featherless
```

## Modelo padrão

O Plugin usa `Qwen/Qwen3-32B` como padrão de configuração porque o Featherless
documenta chamadas nativas de ferramentas para a família Qwen 3. O OpenClaw
configura sua janela de contexto de 32.768 tokens, um limite conservador de saída
de 4.096 tokens e controles de raciocínio do modelo de chat do Qwen.

Os campos de custo do catálogo são zero porque o Featherless oferece vários
modelos de cobrança, e o OpenClaw não incorpora taxas específicas do plano da
conta nem preços por solicitação.

## Outros modelos do Featherless

Use o ID exato do modelo do Featherless após o prefixo de provedor `featherless/`:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "featherless/moonshotai/Kimi-K2-Instruct",
      },
    },
  },
}
```

O OpenClaw deliberadamente não copia o índice público completo de modelos do
Featherless para o seletor. O índice é grande e não fornece metadados estruturados
de recursos suficientes para classificar com segurança todos os modelos de texto,
visão, embeddings e raciocínio. Portanto, IDs desconhecidos são resolvidos com
padrões conservadores somente de texto e sem raciocínio: uma janela de contexto
de 4.096 tokens e um limite de saída de 1.024 tokens.

Adicione uma entrada explícita de modelo do provedor quando um modelo precisar
de metadados diferentes:

```json5
{
  models: {
    mode: "merge",
    providers: {
      featherless: {
        baseUrl: "https://api.featherless.ai/v1",
        apiKey: "${FEATHERLESS_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-3-27b-it",
            name: "Gemma 3 27B",
            input: ["text", "image"],
            reasoning: false,
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

Consulte o catálogo de modelos do Featherless para verificar a disponibilidade
atual dos modelos e as etiquetas de recursos antes de adicionar metadados
personalizados.

## Solução de problemas

- `401` ou `403`: confirme se `FEATHERLESS_API_KEY` está visível para o processo
  do Gateway ou execute novamente a integração inicial.
- Modelo desconhecido: use o ID exato, diferenciando maiúsculas de minúsculas,
  fornecido pelo Featherless após o prefixo `featherless/`.
- Chamadas de ferramentas retornadas como texto: escolha uma família de modelos
  que o Featherless documente como compatível com chamadas nativas de funções,
  como a Qwen 3.
- O Gateway gerenciado não consegue acessar a chave: coloque-a em
  `~/.openclaw/.env` ou em outra fonte de variáveis de ambiente carregada pelo
  serviço e reinicie o Gateway.

## Conteúdo relacionado

- [Provedores de modelos](/pt-BR/concepts/model-providers)
- [Todos os provedores](/pt-BR/providers/index)
- [Modos de raciocínio](/pt-BR/tools/thinking)
