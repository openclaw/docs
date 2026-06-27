---
read_when:
    - Você quer usar a prévia do Tencent Hy3 com OpenClaw
    - Você precisa configurar a chave de API do TokenHub
summary: Configuração do Tencent Cloud TokenHub para a prévia do Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-06-27T18:06:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

Instale o Plugin provedor oficial da Tencent Cloud para acessar o Tencent Hy3 preview pelo endpoint TokenHub (`tencent-tokenhub`) usando uma API compatível com OpenAI.

| Propriedade       | Valor                                                 |
| ----------------- | ----------------------------------------------------- |
| ID do provedor    | `tencent-tokenhub`                                    |
| Pacote            | `@openclaw/tencent-provider`                          |
| Var. env de auth  | `TOKENHUB_API_KEY`                                    |
| Flag de onboarding | `--auth-choice tokenhub-api-key`                     |
| Flag direta da CLI | `--tokenhub-api-key <key>`                           |
| API               | Compatível com OpenAI (`openai-completions`)          |
| URL base padrão   | `https://tokenhub.tencentmaas.com/v1`                 |
| URL base global   | `https://tokenhub-intl.tencentmaas.com/v1` (substituição) |
| Modelo padrão     | `tencent-tokenhub/hy3-preview`                        |

## Início rápido

<Steps>
  <Step title="Instale o Plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="Crie uma chave de API do TokenHub">
    Crie uma chave de API no Tencent Cloud TokenHub. Se você escolher um escopo de acesso limitado para a chave, inclua **Hy3 preview** nos modelos permitidos.
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

| Ref. do modelo                 | Nome                   | Entrada | Contexto | Saída máx. | Observações                    |
| ------------------------------ | ---------------------- | ------- | -------- | ---------- | ------------------------------ |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | texto   | 256,000  | 64,000     | Padrão; com raciocínio habilitado |

Hy3 preview é o grande modelo de linguagem MoE Tencent Hunyuan para raciocínio, seguimento de instruções com contexto longo, código e fluxos de trabalho de agentes. Os exemplos compatíveis com OpenAI da Tencent usam `hy3-preview` como ID do modelo e dão suporte a chamadas de ferramentas padrão de chat-completions, além de `reasoning_effort`.

<Tip>
  O ID do modelo é `hy3-preview`. Não o confunda com os modelos `HY-3D-*` da Tencent, que são APIs de geração 3D e não são o modelo de chat do OpenClaw configurado por este provedor.
</Tip>

## Preços por faixa

O catálogo do provedor inclui metadados de custo por faixa que escalam conforme o tamanho da janela de entrada, portanto as estimativas de custo são preenchidas sem substituições manuais.

| Faixa de tokens de entrada | Taxa de entrada | Taxa de saída | Leitura de cache |
| ------------------------- | --------------- | ------------- | ---------------- |
| 0 - 16,000                | 0.176           | 0.587         | 0.059            |
| 16,000 - 32,000           | 0.235           | 0.939         | 0.088            |
| 32,000+                   | 0.293           | 1.173         | 0.117            |

As taxas são por milhão de tokens em USD, conforme anunciado pela Tencent. Substitua os preços em `models.providers.tencent-tokenhub` somente quando precisar de uma superfície diferente.

## Configuração avançada

<AccordionGroup>
  <Accordion title="Substituição de endpoint">
    O padrão do OpenClaw é o endpoint `https://tokenhub.tencentmaas.com/v1` da Tencent Cloud. A Tencent também documenta um endpoint internacional do TokenHub:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Substitua o endpoint somente quando sua conta ou região do TokenHub exigir isso.

  </Accordion>

  <Accordion title="Disponibilidade do ambiente para o daemon">
    Se o Gateway for executado como um serviço gerenciado (launchd, systemd, Docker), `TOKENHUB_API_KEY` deve estar visível para esse processo. Defina-a em `~/.openclaw/.env` ou via `env.shellEnv` para que os ambientes launchd, systemd ou Docker exec possam lê-la.

    <Warning>
      Chaves exportadas apenas em um shell interativo não ficam visíveis para processos gerenciados do Gateway. Use o arquivo env ou a superfície de configuração para disponibilidade persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Provedores de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs. de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Esquema de configuração completo, incluindo configurações de provedor.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Página do produto TokenHub da Tencent Cloud.
  </Card>
  <Card title="Card do modelo Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Detalhes e benchmarks do Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
