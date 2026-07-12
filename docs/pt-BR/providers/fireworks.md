---
read_when:
    - Você quer usar o Fireworks com o OpenClaw
    - Você precisa da variável de ambiente da chave da API do Fireworks ou do ID do modelo padrão
    - Você está depurando o comportamento de raciocínio desativado do Kimi no Fireworks
summary: Configuração do Fireworks (autenticação + seleção de modelo)
title: Fireworks
x-i18n:
    generated_at: "2026-07-12T15:32:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

O [Fireworks](https://fireworks.ai) disponibiliza modelos de pesos abertos e roteados por meio de uma API compatível com a OpenAI. Instale o plugin oficial do provedor Fireworks para usar dois modelos Kimi pré-catalogados e qualquer id de modelo ou roteador do Fireworks em tempo de execução.

| Propriedade                  | Valor                                                  |
| ---------------------------- | ------------------------------------------------------ |
| Id do provedor               | `fireworks` (alias: `fireworks-ai`)                    |
| Pacote                       | `@openclaw/fireworks-provider`                         |
| Variável de ambiente de auth | `FIREWORKS_API_KEY`                                    |
| Flag de integração inicial   | `--auth-choice fireworks-api-key`                      |
| Flag direta da CLI           | `--fireworks-api-key <key>`                            |
| API                          | Compatível com a OpenAI (`openai-completions`)         |
| URL base                     | `https://api.fireworks.ai/inference/v1`                |
| Modelo padrão                | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias padrão                 | `Kimi K2.5 Turbo`                                      |

## Primeiros passos

<Steps>
  <Step title="Instale o plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Defina a chave de API do Fireworks">
    <CodeGroup>

```bash Integração inicial
openclaw onboard --auth-choice fireworks-api-key
```

```bash Flag direta
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Somente variável de ambiente
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    A integração inicial armazena a chave para o provedor `fireworks` nos seus perfis de autenticação e define o roteador Kimi K2.5 Turbo **Fire Pass** como o modelo padrão.

  </Step>
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider fireworks
    ```

    A lista deve incluir `Kimi K2.6` e `Kimi K2.5 Turbo (Fire Pass)`. Se `FIREWORKS_API_KEY` não for resolvida, `openclaw models status --json` informará a credencial ausente em `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuração não interativa

Para instalações por script ou em CI, passe tudo pela linha de comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catálogo integrado

| Referência do modelo                                    | Nome                        | Entrada        | Contexto | Saída máxima | Raciocínio                 |
| ------------------------------------------------------- | --------------------------- | -------------- | -------- | ------------ | ------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`         | Kimi K2.6                   | texto + imagem | 262,144  | 262,144      | Forçadamente desativado   |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`  | Kimi K2.5 Turbo (Fire Pass) | texto + imagem | 256,000  | 256,000      | Forçadamente desativado (padrão) |

<Note>
  O OpenClaw fixa todos os modelos Kimi do Fireworks como `thinking: off`, pois o Kimi no Fireworks pode expor a cadeia de raciocínio na resposta visível, a menos que a solicitação desative explicitamente o raciocínio. O roteamento do mesmo modelo diretamente pelo [Moonshot](/pt-BR/providers/moonshot) preserva a saída de raciocínio do Kimi. Consulte os [modos de raciocínio](/pt-BR/tools/thinking) para alternar entre provedores.
</Note>

## IDs personalizados de modelos do Fireworks

O OpenClaw aceita qualquer id de modelo ou roteador do Fireworks em tempo de execução. Use o id exato exibido pelo Fireworks e adicione o prefixo `fireworks/`. A resolução dinâmica clona o modelo-base do Fire Pass (entrada de texto + imagem, API compatível com a OpenAI, custo padrão zero) e desativa automaticamente o raciocínio quando o id corresponde ao padrão do Kimi. Os ids dinâmicos do GLM são marcados como compatíveis somente com texto, a menos que você configure uma entrada de modelo personalizada com entrada de imagem.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Como funciona a adição do prefixo ao id do modelo">
    Cada referência de modelo do Fireworks no OpenClaw começa com `fireworks/`, seguido pelo id exato ou pelo caminho do roteador na plataforma Fireworks. Por exemplo:

    - Modelo de roteador: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modelo direto: `fireworks/accounts/fireworks/models/<model-name>`

    O OpenClaw remove o prefixo `fireworks/` ao construir a solicitação da API e envia o caminho restante ao endpoint do Fireworks como o campo `model` compatível com a OpenAI.

  </Accordion>

  <Accordion title="Por que o raciocínio é forçadamente desativado para o Kimi">
    O Fireworks disponibiliza o Kimi sem um canal de raciocínio separado, portanto a cadeia de raciocínio pode aparecer no fluxo visível de `content`. Em cada solicitação do Kimi ao Fireworks, o OpenClaw envia `thinking: { type: "disabled" }` e remove `reasoning`, `reasoning_effort` e `reasoningEffort` da carga útil (`extensions/fireworks/stream.ts`). A política do provedor (`extensions/fireworks/thinking-policy.ts`) anuncia apenas o nível de raciocínio `off` para ids de modelos Kimi, mantendo as alterações manuais de `/think` e as interfaces de política do provedor alinhadas ao contrato de tempo de execução.

    Para usar o raciocínio do Kimi de ponta a ponta, configure o [provedor Moonshot](/pt-BR/providers/moonshot) e roteie o mesmo modelo por ele.

  </Accordion>

  <Accordion title="Disponibilidade do ambiente para o daemon">
    Se o Gateway for executado como um serviço gerenciado (launchd, systemd, Docker), a chave do Fireworks deverá estar visível para esse processo — não apenas para o seu shell interativo.

    <Warning>
      Uma chave exportada apenas em um shell interativo não ajudará um daemon launchd ou systemd, a menos que esse ambiente também seja importado nele. Defina a chave em `~/.openclaw/.env` ou por meio de `env.shellEnv` para torná-la legível pelo processo do Gateway.
    </Warning>

    O OpenClaw carrega `~/.openclaw/.env` ao carregar a configuração, portanto as chaves armazenadas nesse arquivo chegam aos serviços gerenciados do Gateway em todas as plataformas. Reinicie o Gateway (ou execute novamente `openclaw doctor --fix`) após trocar a chave.

  </Accordion>
</AccordionGroup>

## Conteúdo relacionado

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, referências de modelos e o comportamento de failover.
  </Card>
  <Card title="Modos de raciocínio" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de `/think`, políticas de provedores e roteamento de modelos com capacidade de raciocínio.
  </Card>
  <Card title="Moonshot" href="/pt-BR/providers/moonshot" icon="moon">
    Execute o Kimi com saída de raciocínio nativa por meio da própria API do Moonshot.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução geral de problemas e perguntas frequentes.
  </Card>
</CardGroup>
