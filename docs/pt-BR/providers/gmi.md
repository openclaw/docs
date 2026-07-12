---
read_when:
    - Você quer executar o OpenClaw com modelos do GMI Cloud
    - Você precisa do ID, da chave ou do endpoint do provedor GMI
summary: Use a API compatível com a OpenAI da GMI Cloud com o OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-07-12T15:31:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a21fd2a997f44e1f78d97a0fba24ca2bbc00dd193323da712d650ed4ba105355
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud é uma plataforma de inferência hospedada para modelos de fronteira e de pesos abertos
por trás de uma API compatível com a OpenAI. No OpenClaw, ela é um plugin de provedor externo oficial:
instale-o uma vez, armazene as credenciais pelo fluxo normal de autenticação de modelos e use
referências de modelo como `gmi/google/gemini-3.1-flash-lite`.

Use a GMI quando quiser uma única chave de API para várias famílias de modelos hospedados, incluindo
rotas da Anthropic, DeepSeek, Google, Moonshot, OpenAI e Z.AI disponibilizadas pelo
catálogo da GMI. Ela funciona como provedor secundário para fallback de modelos, para comparar
rotas hospedadas entre fornecedores ou quando a GMI disponibiliza um modelo antes do seu
provedor principal. O OpenClaw controla o id do provedor, o perfil de autenticação, os aliases,
a base inicial do catálogo de modelos e a URL base; a GMI controla a disponibilidade atual dos modelos, a cobrança,
os limites de taxa e qualquer política de roteamento do lado do provedor.

| Propriedade      | Valor                                    |
| ------------- | ---------------------------------------- |
| id do provedor   | `gmi` (aliases: `gmi-cloud`, `gmicloud`) |
| Pacote       | `@openclaw/gmi-provider`                 |
| Variável de ambiente de autenticação  | `GMI_API_KEY`                            |
| API           | Compatível com a OpenAI (`openai-completions`) |
| URL base      | `https://api.gmi-serving.com/v1`         |
| Modelo padrão | `gmi/google/gemini-3.1-flash-lite`       |

## Configuração

Instale o plugin, reinicie o gateway e crie uma chave de API na GMI Cloud
(`https://www.gmicloud.ai/`):

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Em seguida, execute:

```bash
openclaw onboard --auth-choice gmi-api-key
```

Configurações não interativas podem passar `--gmi-api-key <key>` ou definir:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Quando escolher a GMI

- Você quer um endpoint hospedado compatível com a OpenAI em vez de um servidor local de modelos.
- Você quer experimentar várias famílias de modelos comerciais e de pesos abertos por meio de uma única
  conta de provedor.
- Você quer um provedor de fallback com roteamento upstream diferente do DeepInfra,
  OpenRouter, Together ou das APIs diretas dos fornecedores.
- Você precisa de ids de modelo, preços ou controles de conta específicos da GMI.

Escolha o provedor direto do fornecedor quando precisar de recursos nativos do fornecedor
que a GMI não disponibiliza por sua rota compatível com a OpenAI. Escolha um provedor local,
como LM Studio, Ollama, SGLang ou vLLM, quando a localidade dos dados ou o controle da
GPU local for mais importante que a conveniência da hospedagem.

## Modelos

O catálogo do plugin fornece como base inicial ids de rotas da GMI Cloud normalmente disponíveis:

| Referência do modelo                          | Entrada        | Contexto   | Saída máxima |
| ---------------------------------- | ------------ | --------- | ---------- |
| `gmi/anthropic/claude-sonnet-4.6`  | texto + imagem | 200,000   | 64,000     |
| `gmi/deepseek-ai/DeepSeek-V3.2`    | texto         | 163,840   | 65,536     |
| `gmi/google/gemini-3.1-flash-lite` | texto + imagem | 1,048,576 | 65,536     |
| `gmi/moonshotai/Kimi-K2.5`         | texto + imagem | 262,144   | 65,536     |
| `gmi/openai/gpt-5.4`               | texto + imagem | 400,000   | 128,000    |
| `gmi/zai-org/GLM-5.1-FP8`          | texto         | 202,752   | 65,536     |

O catálogo é uma base inicial, não uma promessa de que todas as contas possam chamar todos os modelos
a todo momento. Liste o que o provedor configurado informa no seu ambiente:

```bash
openclaw models list --provider gmi
```

## Solução de problemas

- `401` ou `403`: verifique se `GMI_API_KEY` está definida para o processo que executa
  o OpenClaw ou execute novamente a integração inicial para armazenar a chave no perfil de autenticação do provedor.
- Erros de modelo desconhecido: confirme que o modelo existe na sua conta da GMI e use a
  referência completa `gmi/<route-id>` exibida por `openclaw models list --provider gmi`.
- Erros intermitentes do provedor: tente outra rota da GMI ou configure a GMI como
  fallback em vez de usá-la como o único provedor de modelo principal.

## Relacionados

- [Provedores de modelos](/pt-BR/concepts/model-providers)
- [Todos os provedores](/pt-BR/providers/index)
