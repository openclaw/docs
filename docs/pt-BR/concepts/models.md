---
read_when:
    - Alteração do comportamento de fallback do modelo ou da experiência do usuário de seleção
    - Depuração de "modelo não permitido" ou de um fallback obsoleto do provedor padrão
    - Trabalhando no comportamento de mesclagem/segredos do models.json
sidebarTitle: Models CLI
summary: Como o OpenClaw resolve referências de provedor/modelo, chaves de configuração e o comando de chat `/model`
title: CLI de modelos
x-i18n:
    generated_at: "2026-07-12T15:09:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20a5e4861bdafa1f5ff549fc54968051b653611f1ef05e836df855638a7aa967
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Failover de modelo" href="/pt-BR/concepts/model-failover">
    Rotação de perfis de autenticação, períodos de espera e como isso interage com os fallbacks.
  </Card>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers">
    Visão geral rápida dos provedores e exemplos.
  </Card>
  <Card title="Referência da CLI de modelos" href="/pt-BR/cli/models">
    Referência completa do comando `openclaw models` e de suas flags.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults">
    Chaves de configuração de modelos, valores padrão e exemplos.
  </Card>
</CardGroup>

Uma referência de modelo (`provider/model`) escolhe um provedor e um modelo, não o runtime de
agente de baixo nível. Quando a política de runtime não está definida ou é `auto`, a política
de roteamento pertencente ao provedor da OpenAI pode selecionar o Codex somente para uma rota
oficial HTTPS exata da Platform Responses ou ChatGPT Responses, sem nenhuma substituição de
solicitação definida pelo autor; o prefixo `openai/*` sozinho nunca seleciona o Codex.
Adaptadores de Completions, endpoints personalizados e comportamentos de solicitação definidos
pelo autor permanecem no OpenClaw. Endpoints HTTP oficiais em texto simples são rejeitados.
Consulte [runtime de agente implícito da OpenAI](/pt-BR/providers/openai#implicit-agent-runtime).

Referências do Copilot por assinatura (`github-copilot/*`) podem optar pelo Plugin externo de
runtime de agente do GitHub Copilot, mas esse caminho é sempre explícito (nunca selecionado por
`auto`). As substituições de runtime pertencem à política do provedor/modelo, não ao agente ou
à sessão inteira. A seleção do runtime não determina o faturamento: as credenciais de chave de
API da OpenAI e as credenciais de assinatura do ChatGPT/Codex permanecem distintas. Consulte
[Runtimes de agente](/pt-BR/concepts/agent-runtimes) e
[runtime de agente do GitHub Copilot](/pt-BR/plugins/copilot).

## Ordem de seleção

<Steps>
  <Step title="Modelo principal">
    `agents.defaults.model.primary` (ou `agents.defaults.model` como uma string simples).
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks`, tentados em ordem.
  </Step>
  <Step title="Failover de autenticação">
    A rotação de perfis de autenticação ocorre dentro de um provedor antes que o OpenClaw passe para o próximo modelo de fallback.
  </Step>
</Steps>

Superfícies relacionadas à configuração de modelos:

- `agents.defaults.models` é a lista de permissões/catálogo de modelos que o OpenClaw pode usar, além dos aliases. Use entradas `provider/*` para permitir todos os modelos descobertos de um provedor sem listar cada um.
- `agents.defaults.utilityModel` é um modelo opcional de menor custo para tarefas internas curtas, como títulos gerados para sessões do painel, títulos de threads/tópicos de canais compatíveis e narração do progresso. A configuração `agents.list[].utilityModel` por agente a substitui. Quando não está definido, o OpenClaw usa o modelo pequeno padrão declarado pelo provedor principal, quando houver um (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); caso contrário, usa o modelo principal do agente. Defina-o como uma string vazia para desativar o roteamento de utilitários. As tarefas de utilitário são chamadas de modelo separadas e podem enviar conteúdo limitado da tarefa ao provedor de modelo selecionado.
- `agents.defaults.imageModel` é usado somente quando o modelo principal não aceita imagens.
- `agents.defaults.pdfModel` é usado pela ferramenta `pdf`. Se não estiver definido, a ferramenta usa como fallback o `imageModel` e, depois, o modelo resolvido da sessão/padrão.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel` e `videoGenerationModel` dão suporte às ferramentas compartilhadas de geração de mídia. Se não estiver definido, cada modelo infere um provedor padrão com autenticação disponível: primeiro o provedor padrão atual e, depois, os demais provedores registrados para esse recurso, na ordem do ID do provedor. Defina `agents.defaults.mediaGenerationAutoProviderFallback: false` para desativar essa inferência entre provedores, mantendo os fallbacks explícitos.
- A configuração `agents.list[].model` por agente (além das vinculações) substitui `agents.defaults.model` — consulte [Roteamento multiagente](/pt-BR/concepts/multi-agent).

Referência completa das chaves, valores padrão e exemplos em JSON5: [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults).

## Origem da seleção e rigidez do fallback

O mesmo `provider/model` se comporta de maneira diferente dependendo de sua origem:

| Origem                                                                  | Comportamento                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Padrão configurado (`agents.defaults.model.primary`, primário por agente) | Ponto de partida normal; usa `agents.defaults.model.fallbacks`.                                                                                                                                                                                                                        |
| Fallback automático                                                     | Estado temporário de recuperação, armazenado como `modelOverrideSource: "auto"`. O OpenClaw testa novamente o primário original periodicamente, limpa a seleção automática após a recuperação e anuncia as transições de fallback/recuperação uma vez por mudança de estado.               |
| Seleção da sessão pelo usuário                                          | Exata e estrita. `/model`, o seletor de modelos, `session_status(model=...)` e `sessions.patch` armazenam `modelOverrideSource: "user"`. Se esse provedor/modelo ficar inacessível, a execução falhará de forma visível, em vez de prosseguir para outro modelo configurado.                  |
| Cron `--model` / `model` do payload                                     | Primário por tarefa. Ainda usa os fallbacks configurados, a menos que a tarefa forneça seus próprios `fallbacks` no payload (`fallbacks: []` força uma execução estrita).                                                                                                                |

Outras regras de seleção:

- Alterar `agents.defaults.model.primary` não reescreve as fixações de sessão existentes. Se o status informar `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, execute `/model default` para remover a fixação.
- Os seletores de modelo padrão e de lista de permissões da CLI respeitam `models.mode: "replace"`, listando apenas `models.providers.*.models` em vez do catálogo integrado completo.
- O seletor de modelos da interface de controle solicita ao Gateway sua visualização de modelos configurada: `agents.defaults.models` quando definido (incluindo entradas curinga `provider/*`); caso contrário, `models.providers.*.models` mais os provedores com autenticação utilizável. O catálogo integrado completo é reservado para visualizações de navegação explícitas (`models.list` com `view: "all"` ou `openclaw models list --all`).
- As interfaces de inventário de provedores usam `models.list` com `view: "provider-config"` para exibir linhas `models.providers.*.models` definidas pela fonte sem aplicar as listas de permissões dos seletores.

Mecânica completa: [Failover de modelo](/pt-BR/concepts/model-failover).

## Política rápida de modelos

- Defina como principal o modelo mais avançado da geração mais recente disponível para você.
- Use modelos de contingência para tarefas sensíveis a custo/latência e conversas de menor risco.
- Para agentes com ferramentas habilitadas ou entradas não confiáveis, evite categorias de modelos mais antigas ou menos avançadas.

## Integração inicial

```bash
openclaw onboard
```

Configura o modelo e a autenticação para provedores comuns sem editar manualmente a configuração, incluindo OAuth da assinatura do OpenAI Codex e Anthropic (chave de API ou reutilização da CLI do Claude).

Sem um modelo principal configurado, uma nova configuração com chave de API da OpenAI seleciona
`openai/gpt-5.6`; o ID simples da API direta é resolvido para o nível Sol. Uma nova
configuração OAuth do ChatGPT/Codex seleciona a referência exata de catálogo `openai/gpt-5.6-sol`.
A reautenticação preserva um modelo principal explícito existente, incluindo
`openai/gpt-5.5`. Se o GPT-5.6 não estiver disponível para a conta, selecione
`openai/gpt-5.5` explicitamente; o OpenClaw não faz downgrade silencioso.

## "O modelo não é permitido" (e por que as respostas param)

Se `agents.defaults.models` estiver definido, ele se tornará a lista de permissões para `/model` e substituições de sessão. Selecionar um modelo fora dessa lista retorna, antes que qualquer resposta normal seja gerada:

```text
O modelo "provider/model" não é permitido. Use /models para listar os provedores ou /models <provider> para listar os modelos.
Adicione-o com: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

Corrija isso adicionando o modelo a `agents.defaults.models`, removendo completamente a lista de permissões (remova a chave) ou escolhendo um modelo em `/model list`. Se o comando rejeitado incluía uma substituição de runtime, como `/model openai/gpt-5.5 --runtime codex`, corrija primeiro a lista de permissões e repita o mesmo comando `/model ... --runtime ...`.

Para modelos locais/GGUF, a lista de permissões precisa da referência completa com o prefixo do provedor, por exemplo, `ollama/gemma4:26b` ou `lmstudio/Gemma4-26b-a4-it-gguf` — consulte `openclaw models list --provider <provider>` para obter a string exata. Apenas nomes de arquivo ou nomes de exibição não são suficientes quando a lista de permissões está ativa.

Para limitar os provedores sem listar todos os modelos, use entradas curinga `provider/*`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

Nesse caso, `/model`, `/models` e os seletores de modelos exibem apenas o catálogo descoberto para esses provedores, e novos modelos podem aparecer sem editar a lista de permissões. Combine entradas exatas `provider/model` com entradas `provider/*` para incluir um modelo específico de outro provedor.

Exemplo de lista de permissões com aliases:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

<Accordion title="Edições seguras da lista de permissões pela CLI">
Use `--merge` para alterações aditivas:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` recusa atribuições de objetos simples a `agents.defaults.models`, `models.providers` ou `models.providers.<id>.models` quando elas removeriam entradas existentes; use `--replace` somente quando o novo valor deva se tornar o valor completo de destino. A configuração interativa de provedores e `openclaw configure --section model` já mesclam as seleções específicas do provedor na lista de permissões, portanto, adicionar um provedor não remove entradas não relacionadas; a configuração preserva um `agents.defaults.model.primary` existente. Comandos explícitos como `openclaw models auth login --provider <id> --set-default` e `openclaw models set <model>` ainda substituem o modelo principal.
</Accordion>

## `/model` no chat

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

- `/model` e `/model list` exibem um seletor numerado compacto (família de modelos + provedores disponíveis); `/model <#>` seleciona uma opção dele. No Discord, isso abre listas suspensas de provedor/modelo com uma etapa Submit; no Telegram, as seleções do seletor são específicas da sessão e nunca reescrevem o padrão persistente do agente em `openclaw.json`. `/models add` está obsoleto e retorna uma mensagem em vez de registrar modelos pelo chat.
- `/model` persiste imediatamente a nova seleção da sessão. Se o agente estiver ocioso, a próxima execução a usará imediatamente; se uma execução já estiver ativa, a troca ficará na fila para o próximo ponto de nova tentativa limpa (ou para um ponto posterior, se a atividade de ferramentas ou a saída da resposta já tiver começado).
- `/model default` limpa a seleção da sessão para que ela volte a herdar o modelo primário configurado.
- Uma referência de `/model` selecionada pelo usuário é estrita para essa sessão: se ficar inacessível, a resposta falhará de forma visível em vez de recorrer silenciosamente a `agents.defaults.model.fallbacks`. Os padrões configurados e os modelos primários de tarefas cron ainda usam cadeias de fallback.
- `/model status` é a visualização detalhada: candidatos de autenticação por provedor e, quando configurados, o endpoint `baseUrl` do provedor e o modo de `api`.
- As referências de modelo são analisadas pela divisão na primeira `/`; digite `provider/model`. Se o próprio ID do modelo contiver `/` (no estilo do OpenRouter), inclua o prefixo do provedor, por exemplo, `/model openrouter/moonshotai/kimi-k2`. Se você omitir o provedor, o OpenClaw tentará: (1) correspondência de alias, (2) correspondência exclusiva com um provedor configurado para esse ID de modelo exato sem prefixo, (3) o provedor padrão configurado (fallback obsoleto) — e, se esse provedor não disponibilizar mais o modelo padrão configurado, usará o primeiro provedor/modelo configurado para evitar expor um padrão obsoleto de um provedor removido.
- As referências de modelo são normalizadas para letras minúsculas; fora isso, os IDs de provedores são exatos, portanto use o ID anunciado pelo plugin.

Comportamento completo dos comandos e configuração: [Comandos de barra](/pt-BR/tools/slash-commands).

## CLI

```bash
openclaw models status
openclaw models list
openclaw models set <provider/model>
openclaw models set-image <provider/model>
openclaw models scan
openclaw models aliases list|add|remove
openclaw models fallbacks list|add|remove|clear
openclaw models image-fallbacks list|add|remove|clear
openclaw models auth list|add|login|paste-api-key|paste-token|setup-token|order
```

`openclaw models` sem subcomando é um atalho para `models status`, que também exibe a expiração do OAuth para perfis do armazenamento de autenticação (por padrão, alerta quando faltam até 24h). Opções completas, formatos JSON e subcomandos de perfis de autenticação: [Referência da CLI de modelos](/pt-BR/cli/models).

<AccordionGroup>
  <Accordion title="Verificação (modelos gratuitos do OpenRouter)">
    `openclaw models scan` inspeciona o catálogo público de modelos gratuitos do OpenRouter e pode testar candidatos em tempo real quanto à compatibilidade com ferramentas e imagens. O catálogo em si é público, portanto verificações somente de metadados (`--no-probe`) não precisam de chave; testes em tempo real e `--set-default`/`--set-image` exigem uma chave de API do OpenRouter (perfil de autenticação ou `OPENROUTER_API_KEY`) e, sem ela, adotam uma postura restritiva, gerando apenas a saída de metadados.

    Os resultados são classificados por: compatibilidade com imagens, depois latência de ferramentas, depois tamanho do contexto e, por fim, quantidade de parâmetros. Em um TTY, os resultados testados solicitam uma seleção interativa de fallback; o modo não interativo exige `--yes` para aceitar os padrões.

  </Accordion>
</AccordionGroup>

## Registro de modelos (`models.json`)

Os provedores personalizados configurados em `models.providers` são gravados em `models.json` no diretório do agente (por padrão, `~/.openclaw/agents/<agentId>/agent/models.json`). Os catálogos de plugins de provedores são armazenados separadamente como fragmentos de catálogo gerados e pertencentes aos plugins, sendo carregados automaticamente. Por padrão, esse arquivo é mesclado com a configuração; defina `models.mode: "replace"` para usar somente os provedores configurados por você.

<AccordionGroup>
  <Accordion title="Precedência do modo de mesclagem">
    Para IDs de provedores correspondentes:

    - Um `baseUrl` não vazio já presente no `models.json` do agente prevalece.
    - Uma `apiKey` não vazia em `models.json` prevalece somente quando esse provedor não é gerenciado por SecretRef no contexto atual de configuração/perfil de autenticação.
    - Os valores de `apiKey` gerenciados por SecretRef são atualizados a partir dos marcadores de origem, em vez de persistirem os segredos resolvidos: o nome da variável de ambiente para referências de ambiente e `secretref-managed` para referências de arquivo/execução.
    - Os valores de cabeçalho gerenciados por SecretRef são atualizados da mesma forma, usando `secretref-env:ENV_VAR_NAME` para referências de ambiente.
    - Valores de `apiKey`/`baseUrl` vazios ou ausentes em `models.json` recorrem a `models.providers` da configuração.
    - Outros campos do provedor são atualizados a partir da configuração e dos dados normalizados do catálogo.

  </Accordion>
</AccordionGroup>

A persistência dos marcadores tem a origem como autoridade: sempre que regenera `models.json` — inclusive em fluxos acionados por comandos, como `openclaw agent` —, o OpenClaw grava os marcadores a partir do instantâneo da configuração de origem ativa (antes da resolução), e não a partir dos valores de segredos resolvidos em tempo de execução.

## Relacionados

- [Runtimes de agentes](/pt-BR/concepts/agent-runtimes) — OpenClaw, Codex e outros runtimes de loop de agentes
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — chaves de configuração de modelos
- [Geração de imagens](/pt-BR/tools/image-generation) — configuração do modelo de imagens
- [Failover de modelos](/pt-BR/concepts/model-failover) — cadeias de fallback
- [Provedores de modelos](/pt-BR/concepts/model-providers) — roteamento de provedores e autenticação
- [Referência da CLI de modelos](/pt-BR/cli/models) — referência completa de comandos e opções
- [Geração de música](/pt-BR/tools/music-generation) — configuração do modelo de música
- [Geração de vídeo](/pt-BR/tools/video-generation) — configuração do modelo de vídeo
