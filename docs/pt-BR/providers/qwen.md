---
read_when:
    - Você quer usar o Qwen com o OpenClaw
    - Você usava anteriormente o OAuth do Qwen
summary: Use o Qwen Cloud pelo provider qwen integrado do OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-06T03:11:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: f175793693ab6a4c3f1f4d42040e673c15faf7603a500757423e9e06977c989d
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**O OAuth do Qwen foi removido.** A integração OAuth do nível gratuito
(`qwen-portal`) que usava endpoints `portal.qwen.ai` não está mais disponível.
Consulte [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) para
entender o contexto.

</Warning>

## Recomendado: Qwen Cloud

O OpenClaw agora trata o Qwen como um provider integrado de primeira classe com o id canônico
`qwen`. O provider integrado usa os endpoints do Qwen Cloud / Alibaba DashScope e
Coding Plan e mantém ids legados `modelstudio` funcionando como um
alias de compatibilidade.

- Provider: `qwen`
- Variável de ambiente preferida: `QWEN_API_KEY`
- Também aceitas por compatibilidade: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Estilo de API: compatível com OpenAI

Se você quiser `qwen3.6-plus`, prefira o endpoint **Standard (pay-as-you-go)**.
O suporte do Coding Plan pode demorar mais para alcançar o catálogo público.

```bash
# Endpoint global do Coding Plan
openclaw onboard --auth-choice qwen-api-key

# Endpoint China do Coding Plan
openclaw onboard --auth-choice qwen-api-key-cn

# Endpoint global Standard (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key

# Endpoint China Standard (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

Ids legados de `auth-choice` `modelstudio-*` e refs de modelo `modelstudio/...` ainda
funcionam como aliases de compatibilidade, mas novos fluxos de configuração devem preferir os ids
canônicos de `auth-choice` `qwen-*` e refs de modelo `qwen/...`.

Após o onboarding, defina um modelo padrão:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Tipos de plano e endpoints

| Plano                      | Região | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (assinatura)   | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (assinatura)   | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

O provider seleciona automaticamente o endpoint com base no seu auth choice. As opções
canônicas usam a família `qwen-*`; `modelstudio-*` continua apenas para compatibilidade.
Você pode sobrescrever com um `baseUrl` personalizado na configuração.

Endpoints nativos do Model Studio anunciam compatibilidade de uso em streaming no
transporte compartilhado `openai-completions`. O OpenClaw agora baseia isso nas
capacidades do endpoint, então ids personalizados de provider compatíveis com DashScope que apontam para os
mesmos hosts nativos herdam o mesmo comportamento de uso em streaming, em vez de
exigirem especificamente o id integrado de provider `qwen`.

## Obtenha sua chave de API

- **Gerenciar chaves**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Documentação**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Catálogo integrado

O OpenClaw atualmente inclui este catálogo Qwen integrado:

| Ref do modelo               | Entrada     | Contexto  | Observações                                        |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | texto, imagem | 1,000,000 | Modelo padrão                                      |
| `qwen/qwen3.6-plus`         | texto, imagem | 1,000,000 | Prefira endpoints Standard quando precisar deste modelo |
| `qwen/qwen3-max-2026-01-23` | texto       | 262,144   | Linha Qwen Max                                     |
| `qwen/qwen3-coder-next`     | texto       | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | texto       | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | texto       | 1,000,000 | Raciocínio ativado                                 |
| `qwen/glm-5`                | texto       | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | texto       | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | texto, imagem | 262,144   | Moonshot AI via Alibaba                            |

A disponibilidade ainda pode variar por endpoint e plano de cobrança mesmo quando um modelo
está presente no catálogo integrado.

A compatibilidade de uso em streaming nativo se aplica tanto aos hosts do Coding Plan quanto
aos hosts Standard compatíveis com DashScope:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Disponibilidade do Qwen 3.6 Plus

`qwen3.6-plus` está disponível nos endpoints Model Studio Standard (pay-as-you-go):

- China: `dashscope.aliyuncs.com/compatible-mode/v1`
- Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Se os endpoints do Coding Plan retornarem um erro de "unsupported model" para
`qwen3.6-plus`, mude para Standard (pay-as-you-go) em vez do par
endpoint/chave do Coding Plan.

## Plano de capacidades

A extensão `qwen` está sendo posicionada como a origem do fornecedor para toda a superfície do Qwen
Cloud, não apenas para modelos de coding/texto.

- Modelos de texto/chat: integrados agora
- Tool calling, saída estruturada, thinking: herdados do transporte compatível com OpenAI
- Geração de imagem: planejada na camada de plugin de provider
- Entendimento de imagem/vídeo: integrado agora no endpoint Standard
- Speech/áudio: planejados na camada de plugin de provider
- Embeddings/reranking de memória: planejados por meio da superfície do adaptador de embeddings
- Geração de vídeo: integrada agora por meio da capacidade compartilhada de geração de vídeo

## Complementos multimodais

A extensão `qwen` agora também expõe:

- Entendimento de vídeo via `qwen-vl-max-latest`
- Geração de vídeo Wan via:
  - `wan2.6-t2v` (padrão)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Essas superfícies multimodais usam os endpoints **Standard** do DashScope, não os
endpoints do Coding Plan.

- URL base Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- URL base Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

Para geração de vídeo, o OpenClaw mapeia a região Qwen configurada para o host
DashScope AIGC correspondente antes de enviar o job:

- Global/Intl: `https://dashscope-intl.aliyuncs.com`
- China: `https://dashscope.aliyuncs.com`

Isso significa que um `models.providers.qwen.baseUrl` normal apontando para qualquer um dos
hosts Qwen do Coding Plan ou Standard ainda mantém a geração de vídeo no endpoint
regional correto de vídeo do DashScope.

Para geração de vídeo, defina explicitamente um modelo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Limites atuais integrados de geração de vídeo do Qwen:

- Até **1** vídeo de saída por solicitação
- Até **1** imagem de entrada
- Até **4** vídeos de entrada
- Até **10 segundos** de duração
- Compatível com `size`, `aspectRatio`, `resolution`, `audio` e `watermark`
- O modo de imagem/vídeo de referência atualmente exige **URLs remotas http(s)**. Caminhos
  locais de arquivo são rejeitados antecipadamente porque o endpoint de vídeo do DashScope não
  aceita buffers locais enviados para essas referências.

Consulte [Geração de vídeo](/tools/video-generation) para ver os parâmetros
compartilhados da ferramenta, seleção de provider e comportamento de failover.

## Observação sobre ambiente

Se o Gateway estiver em execução como daemon (launchd/systemd), certifique-se de que `QWEN_API_KEY`
esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).
