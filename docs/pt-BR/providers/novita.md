---
read_when:
    - Você quer executar o OpenClaw com modelos da NovitaAI
    - Você precisa do ID, da chave ou do endpoint do provedor Novita
summary: Use a API compatível com a OpenAI da NovitaAI com o OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-07-12T15:40:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI é um provedor de infraestrutura de IA hospedada com uma API compatível com a OpenAI.
Ele é fornecido como um provedor integrado ao OpenClaw (sem instalação separada de plugin), portanto
as credenciais passam pelo fluxo normal de autenticação de modelos e as referências de modelos têm o formato
`novita/deepseek/deepseek-v3-0324`.

## Configuração

Crie uma chave de API em [novita.ai/settings/key-management](https://novita.ai/settings/key-management) e execute:

```bash
openclaw onboard --auth-choice novita-api-key
```

Ou defina:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Padrões

| Configuração      | Valor                              |
| ----------------- | ---------------------------------- |
| ID do provedor    | `novita`                           |
| Aliases           | `novita-ai`, `novitaai`            |
| URL base          | `https://api.novita.ai/openai/v1`  |
| Variável de ambiente | `NOVITA_API_KEY`                |
| Modelo padrão     | `novita/deepseek/deepseek-v3-0324` |

## Catálogo de modelos integrado

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

Este é um ponto de partida, não um catálogo em tempo real. Sua conta, região ou
a oferta atual da Novita podem adicionar, remover ou restringir rotas. Verifique antes de
definir um padrão de longo prazo:

```bash
openclaw models list --provider novita
```

## Quando escolher a Novita

- Acesso hospedado a modelos de pesos abertos com uma API compatível com a OpenAI.
- Rotas das famílias DeepSeek, Kimi, MiniMax, GLM ou Qwen por meio de uma única conta
  de provedor.
- Outro caminho de fallback hospedado além do DeepInfra, GMI, OpenRouter ou das APIs
  diretas dos fornecedores.
- Hospedagem de modelos pelo provedor em vez de manter a infraestrutura do LM Studio, Ollama,
  SGLang ou vLLM.

Escolha um provedor direto do fornecedor quando precisar de parâmetros de solicitação
nativos do fornecedor ou contratos de suporte. Escolha um provedor local quando o modelo precisar
ser executado em seu próprio hardware ou dentro do limite da sua rede.

## Solução de problemas

- `401`/`403`: verifique a chave na página de gerenciamento de chaves da Novita e execute novamente
  `openclaw onboard --auth-choice novita-api-key` se o perfil armazenado estiver
  desatualizado.
- Erros de modelo desconhecido: use o `novita/<route-id>` exato retornado por
  `openclaw models list --provider novita`.
- Rotas lentas ou com falha: tente outra rota de modelo da Novita ou defina a Novita como um
  provedor de fallback para cargas de trabalho que tolerem variações específicas
  do provedor.

## Relacionado

- [Provedores de modelos](/pt-BR/concepts/model-providers)
- [Diretório de provedores](/pt-BR/providers/index)
