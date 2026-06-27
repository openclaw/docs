---
read_when:
    - Você quer executar o OpenClaw com modelos da GMI Cloud
    - Você precisa do id, da chave ou do endpoint do provedor GMI
summary: Use a API compatível com OpenAI da GMI Cloud com OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-06-27T18:03:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119db777a2285259d646c9b5ab7e3885e3c7c714039277fa06a5a881e46284b9
    source_path: providers/gmi.md
    workflow: 16
---

A GMI Cloud é uma plataforma de inferência hospedada para modelos de fronteira e open-weight
por trás de uma API compatível com OpenAI. No OpenClaw, ela é um provedor externo oficial
Plugin, o que significa que você a instala uma vez, seleciona com o id de provedor `gmi`,
armazena credenciais pela autenticação normal de modelo e usa referências de modelo como
`gmi/google/gemini-3.1-flash-lite`.

Use a GMI quando quiser uma única chave de API para várias famílias de modelos hospedados, incluindo
rotas Google, Anthropic, OpenAI, DeepSeek, Moonshot e Z.AI expostas pelo
catálogo da GMI. Ela é útil como provedor secundário para fallback de modelo, para comparar
rotas hospedadas entre fornecedores ou quando a GMI disponibiliza um modelo antes do seu
provedor primário.

Este provedor usa semântica de chat compatível com OpenAI. O OpenClaw controla o
id de provedor, o perfil de autenticação, os aliases, a semente do catálogo de modelos e a URL base; a GMI controla a disponibilidade ativa
dos modelos, a cobrança, os limites de taxa e qualquer política de roteamento do lado do provedor.

## Configuração

Instale o Plugin, reinicie o Gateway e então crie uma chave de API na GMI Cloud:

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Depois execute:

```bash
openclaw onboard --auth-choice gmi-api-key
```

Ou defina:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Padrões

- Provedor: `gmi`
- Aliases: `gmi-cloud`, `gmicloud`
- URL base: `https://api.gmi-serving.com/v1`
- Variável de ambiente: `GMI_API_KEY`
- Modelo padrão: `gmi/google/gemini-3.1-flash-lite`

## Quando escolher a GMI

- Você quer um endpoint hospedado compatível com OpenAI em vez de um servidor de modelo local.
- Você quer experimentar várias famílias de modelos comerciais e open-weight por meio de uma única
  conta de provedor.
- Você quer um provedor de fallback com roteamento upstream diferente do OpenRouter,
  DeepInfra, Together ou das APIs diretas dos fornecedores.
- Você precisa de ids de modelo, preços ou controles de conta específicos da GMI.

Escolha o provedor direto do fornecedor quando precisar de recursos nativos do fornecedor
que a GMI não expõe por meio da sua rota compatível com OpenAI. Escolha um
provedor local, como Ollama, LM Studio, vLLM ou SGLang, quando a localidade dos dados ou o controle local
de GPU forem mais importantes que a conveniência hospedada.

## Modelos

O catálogo do Plugin semeia ids de rotas da GMI Cloud normalmente disponíveis, incluindo:

- `gmi/zai-org/GLM-5.1-FP8`
- `gmi/deepseek-ai/DeepSeek-V3.2`
- `gmi/moonshotai/Kimi-K2.5`
- `gmi/google/gemini-3.1-flash-lite`
- `gmi/anthropic/claude-sonnet-4.6`
- `gmi/openai/gpt-5.4`

O catálogo é uma semente, não uma promessa de que todas as contas possam chamar todos os modelos em
todos os momentos. Use o comando de listagem de modelos do OpenClaw para ver o que o
provedor configurado relata no seu ambiente:

```bash
openclaw models list --provider gmi
```

## Solução de problemas

- `401` ou `403`: verifique se `GMI_API_KEY` está definida para o processo que executa
  o OpenClaw, ou execute o onboarding novamente para armazenar a chave no perfil de autenticação do provedor.
- Erros de modelo desconhecido: confirme que o modelo existe na sua conta GMI e use a
  referência completa `gmi/<route-id>` mostrada por `openclaw models list --provider gmi`.
- Erros intermitentes do provedor: tente uma rota GMI diferente ou configure a GMI como
  fallback em vez do único provedor de modelo primário.

## Relacionado

- [Provedores de modelo](/pt-BR/concepts/model-providers)
- [Todos os provedores](/pt-BR/providers/index)
