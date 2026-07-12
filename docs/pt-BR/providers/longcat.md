---
read_when:
    - Você quer usar o LongCat-2.0 com o OpenClaw
    - Você precisa da chave da API LongCat ou dos limites do modelo
summary: Configuração da API LongCat para o LongCat-2.0
title: LongCat
x-i18n:
    generated_at: "2026-07-12T15:40:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) fornece uma API hospedada para o LongCat-2.0, um
modelo de raciocínio desenvolvido para programação e cargas de trabalho agênticas. O OpenClaw fornece o
plugin oficial `longcat` para o endpoint compatível com OpenAI da LongCat.

| Propriedade   | Valor                                     |
| ------------- | ----------------------------------------- |
| Provedor      | `longcat`                                 |
| Autenticação  | `LONGCAT_API_KEY`                         |
| API           | Chat Completions compatível com OpenAI    |
| URL base      | `https://api.longcat.chat/openai`         |
| Modelo        | `longcat/LongCat-2.0`                     |
| Contexto      | 1,048,576 tokens                          |
| Saída máxima  | 131,072 tokens                            |
| Entrada       | Texto                                     |

## Instalar o plugin

Instale o pacote oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## Primeiros passos

<Steps>
  <Step title="Criar uma chave de API">
    Entre na [Plataforma de API da LongCat](https://longcat.chat/platform/) e
    crie uma chave na página [API Keys](https://longcat.chat/platform/api_keys).
  </Step>
  <Step title="Executar a configuração inicial">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="Verificar o modelo">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

A configuração inicial adiciona o catálogo hospedado e seleciona `longcat/LongCat-2.0` quando nenhum
modelo principal já está configurado.

### Configuração não interativa

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## Comportamento de raciocínio

A LongCat oferece controle binário de pensamento. O OpenClaw mapeia os níveis de pensamento ativados
para `thinking: { type: "enabled" }` e `/think off` para
`thinking: { type: "disabled" }`. Atualmente, a LongCat não documenta
`reasoning_effort`, portanto o OpenClaw não o envia.

A LongCat retorna o raciocínio em `reasoning_content`. O OpenClaw preserva esse campo
ao reproduzir turnos de chamada de ferramenta do assistente, para que sessões agênticas de vários turnos mantenham
o formato de mensagem esperado pelo provedor.

## Preços

O catálogo integrado usa os preços sob demanda da LongCat em USD por milhão de
tokens: $0.75 para entrada sem cache, $0.015 para entrada em cache e $2.95 para saída. A LongCat pode
oferecer descontos temporários; a [página de preços](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
e seus registros de cobrança são as fontes oficiais.

## LongCat-2.0 auto-hospedado

O provedor `longcat` é destinado à API hospedada da LongCat. Para os pesos abertos no
[Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0), disponibilize o
modelo por meio de um runtime compatível com OpenAI e use o provedor existente
[vLLM](/pt-BR/providers/vllm) ou [SGLang](/pt-BR/providers/sglang) do OpenClaw.

Mantenha o identificador exato do modelo do runtime no catálogo do provedor auto-hospedado;
não encaminhe uma implantação local por meio de `longcat/LongCat-2.0`.

## Solução de problemas

<AccordionGroup>
  <Accordion title="A chave funciona em um shell, mas não no Gateway">
    Os processos do Gateway gerenciados por daemon não herdam todas as variáveis do shell
    interativo. Coloque `LONGCAT_API_KEY` em `~/.openclaw/.env`, configure-a por meio da
    configuração inicial ou use uma referência de segredo aprovada.
  </Accordion>

  <Accordion title="As solicitações falham com 402 ou 429">
    `402` significa que a conta não tem cota de tokens suficiente. `429` significa que a chave de
    API atingiu um limite de requisições. Verifique o [uso da LongCat](https://longcat.chat/platform/usage)
    e tente novamente as solicitações limitadas após o período de espera do provedor.
  </Accordion>

  <Accordion title="O modelo não aparece">
    Execute `openclaw plugins list` e confirme que o plugin `longcat` está
    ativado; depois, execute `openclaw models list --provider longcat`.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Configuração de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Documentação da API da LongCat" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    Endpoints da API hospedada, autenticação, limites e exemplos.
  </Card>
  <Card title="Ficha do modelo LongCat-2.0" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    Arquitetura, orientações de implantação e detalhes do modelo.
  </Card>
  <Card title="Segredos" href="/pt-BR/gateway/secrets" icon="key">
    Armazene as credenciais do provedor sem incorporar texto simples na configuração.
  </Card>
</CardGroup>
