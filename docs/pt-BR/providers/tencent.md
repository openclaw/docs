---
read_when:
    - Você quer usar a prévia do Tencent Hy3 com o OpenClaw
    - Você precisa configurar a chave de API do TokenHub
summary: Configuração do Tencent Cloud TokenHub para a prévia do Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-05-06T09:11:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: a194e10b0e77e2567e6835f08d1cc0fa2a32fa8d37b1851fb83024b172a03fe3
    source_path: providers/tencent.md
    workflow: 16
---

O Tencent Cloud é distribuído como um Plugin de provedor incluído no OpenClaw. Ele fornece acesso ao Tencent Hy3 preview pelo endpoint TokenHub (`tencent-tokenhub`) usando uma API compatível com OpenAI.

| Propriedade      | Valor                                                 |
| ---------------- | ----------------------------------------------------- |
| ID do provedor   | `tencent-tokenhub`                                    |
| Plugin           | incluído, `enabledByDefault: true`                    |
| Var. env. de auth | `TOKENHUB_API_KEY`                                   |
| Flag de onboarding | `--auth-choice tokenhub-api-key`                    |
| Flag direta da CLI | `--tokenhub-api-key <key>`                          |
| API              | compatível com OpenAI (`openai-completions`)          |
| URL base padrão  | `https://tokenhub.tencentmaas.com/v1`                 |
| URL base global  | `https://tokenhub-intl.tencentmaas.com/v1` (substituição) |
| Modelo padrão    | `tencent-tokenhub/hy3-preview`                        |

## Início rápido

<Steps>
  <Step title="Crie uma chave de API do TokenHub">
    Crie uma chave de API no Tencent Cloud TokenHub. Se escolher um escopo de acesso limitado para a chave, inclua **Hy3 preview** nos modelos permitidos.
  </Step>
  <Step title="Execute o onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Flag direta
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Somente env
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verifique o modelo">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Configuração não interativa

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catálogo integrado

| Ref do modelo                 | Nome                   | Entrada | Contexto | Saída máxima | Observações                |
| ------------------------------ | ---------------------- | ------- | -------- | ------------ | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | texto   | 256.000  | 64.000       | Padrão; com raciocínio habilitado |

Hy3 preview é o grande modelo de linguagem MoE Tencent Hunyuan para raciocínio, acompanhamento de instruções com contexto longo, código e fluxos de trabalho de agente. Os exemplos compatíveis com OpenAI da Tencent usam `hy3-preview` como ID do modelo e oferecem suporte a chamadas de ferramentas padrão de chat-completions, além de `reasoning_effort`.

<Tip>
  O ID do modelo é `hy3-preview`. Não o confunda com os modelos `HY-3D-*` da Tencent, que são APIs de geração 3D e não são o modelo de chat do OpenClaw configurado por este provedor.
</Tip>

## Preços em camadas

O catálogo incluído traz metadados de custo em camadas que escalam com o tamanho da janela de entrada, para que as estimativas de custo sejam preenchidas sem substituições manuais.

| Intervalo de tokens de entrada | Taxa de entrada | Taxa de saída | Leitura do cache |
| ------------------------------ | --------------- | ------------- | ---------------- |
| 0 - 16.000                     | 0,176           | 0,587         | 0,059            |
| 16.000 - 32.000                | 0,235           | 0,939         | 0,088            |
| 32.000+                        | 0,293           | 1,173         | 0,117            |

As taxas são por milhão de tokens em USD, conforme anunciado pela Tencent. Substitua os preços em `models.providers.tencent-tokenhub` somente quando precisar de uma superfície diferente.

## Configuração avançada

<AccordionGroup>
  <Accordion title="Substituição do endpoint">
    O OpenClaw usa por padrão o endpoint `https://tokenhub.tencentmaas.com/v1` do Tencent Cloud. A Tencent também documenta um endpoint internacional do TokenHub:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Substitua o endpoint somente quando sua conta ou região do TokenHub exigir.

  </Accordion>

  <Accordion title="Disponibilidade do ambiente para o daemon">
    Se o Gateway for executado como um serviço gerenciado (launchd, systemd, Docker), `TOKENHUB_API_KEY` deve estar visível para esse processo. Defina-o em `~/.openclaw/.env` ou via `env.shellEnv` para que ambientes launchd, systemd ou Docker exec possam lê-lo.

    <Warning>
      Chaves definidas somente em `~/.profile` não ficam visíveis para processos gerenciados do gateway. Use o arquivo env ou a costura de configuração para disponibilidade persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelos e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Esquema de configuração completo, incluindo configurações de provedor.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Página do produto TokenHub do Tencent Cloud.
  </Card>
  <Card title="Card do modelo Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Detalhes e benchmarks do Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
