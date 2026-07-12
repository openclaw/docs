---
read_when:
    - Você quer usar o Tencent hy3 com o OpenClaw
    - Você precisa configurar a chave de API do TokenHub ou do TokenPlan
summary: Configuração do Tencent Cloud TokenHub e do TokenPlan para hy3
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-12T15:41:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

Instale o plugin oficial do provedor Tencent Cloud para acessar o Tencent Hy3 por meio de dois endpoints — TokenHub (`tencent-tokenhub`) e TokenPlan (`tencent-tokenplan`) — usando uma API compatível com OpenAI.

| Propriedade                            | Valor                                                 |
| -------------------------------------- | ----------------------------------------------------- |
| IDs dos provedores                     | `tencent-tokenhub`, `tencent-tokenplan`               |
| Pacote                                 | `@openclaw/tencent-provider`                          |
| Variável de ambiente de autenticação do TokenHub  | `TOKENHUB_API_KEY`                                    |
| Variável de ambiente de autenticação do TokenPlan | `TOKENPLAN_API_KEY`                                   |
| Flag de integração do TokenHub         | `--auth-choice tokenhub-api-key`                      |
| Flag de integração do TokenPlan        | `--auth-choice tokenplan-api-key`                     |
| Flag direta da CLI para o TokenHub     | `--tokenhub-api-key <key>`                            |
| Flag direta da CLI para o TokenPlan    | `--tokenplan-api-key <key>`                           |
| API                                    | Compatível com OpenAI (`openai-completions`)          |
| URL base do TokenHub                   | `https://tokenhub.tencentmaas.com/v1`                 |
| URL base global do TokenHub            | `https://tokenhub-intl.tencentmaas.com/v1` (substituição) |
| URL base do TokenPlan                  | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| Modelo padrão                          | `tencent-tokenhub/hy3`                                |

## Início rápido

<Steps>
  <Step title="Crie uma chave de API da Tencent">
    Crie uma chave de API para o Tencent Cloud TokenHub e o TokenPlan. Se você escolher um escopo de acesso limitado para a chave, inclua **hy3** (e **hy3 preview**, caso pretenda usá-lo no TokenHub) nos modelos permitidos.
  </Step>
  <Step title="Execute a integração">
    <CodeGroup>

```bash Integração do TokenHub
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Flag direta do TokenHub
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Integração do TokenPlan
openclaw onboard --auth-choice tokenplan-api-key
```

```bash Flag direta do TokenPlan
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash Somente variáveis de ambiente
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verifique o modelo">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## Configuração não interativa

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
`--accept-risk` é obrigatório quando usado com `--non-interactive`.
</Note>

## Catálogo integrado

| Referência do modelo            | Nome                   | Entrada | Contexto | Saída máxima | Observações                 |
| ------------------------------- | ---------------------- | ------- | -------- | ------------ | --------------------------- |
| `tencent-tokenhub/hy3-preview`  | hy3 preview (TokenHub) | texto   | 256,000  | 64,000       | raciocínio habilitado       |
| `tencent-tokenhub/hy3`          | hy3 (TokenHub)         | texto   | 256,000  | 64,000       | raciocínio habilitado       |
| `tencent-tokenplan/hy3`         | hy3 (TokenPlan)        | texto   | 256,000  | 64,000       | raciocínio habilitado       |

O hy3 é o grande modelo de linguagem MoE do Tencent Hunyuan para raciocínio, execução de instruções com contexto longo, código e fluxos de trabalho de agentes. Os exemplos da Tencent compatíveis com OpenAI usam `hy3` como ID do modelo e oferecem suporte à chamada de ferramentas padrão de chat completions, além de `reasoning_effort`.

<Tip>
  O ID do modelo é `hy3`. Não o confunda com os modelos `HY-3D-*` da Tencent, que são APIs de geração 3D e não correspondem ao modelo de chat do OpenClaw configurado por este provedor.
</Tip>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Substituição do endpoint">
    O catálogo integrado do OpenClaw usa o endpoint `https://tokenhub.tencentmaas.com/v1` do Tencent Cloud. Substitua-o somente se sua conta ou região do TokenHub exigir um endpoint diferente:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Disponibilidade das variáveis de ambiente para o daemon">
    Se o Gateway for executado como um serviço gerenciado (launchd, systemd, Docker), `TOKENHUB_API_KEY` e `TOKENPLAN_API_KEY` deverão estar visíveis para esse processo. Defina-as em `~/.openclaw/.env` ou por meio de `env.shellEnv` para que os ambientes de execução do launchd, systemd ou Docker possam lê-las.

    <Warning>
      Chaves exportadas somente em um shell interativo não ficam visíveis para processos gerenciados do Gateway. Use o arquivo de variáveis de ambiente ou o ponto de configuração para garantir disponibilidade persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração, incluindo as configurações dos provedores.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Página do produto TokenHub do Tencent Cloud.
  </Card>
  <Card title="Cartão do modelo Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Detalhes e benchmarks do Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
