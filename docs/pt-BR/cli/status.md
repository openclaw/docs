---
read_when:
    - Você quer um diagnóstico rápido da integridade dos canais + destinatários das sessões recentes
    - Você quer um status "all" que possa ser colado para depuração
summary: Referência da CLI para `openclaw status` (diagnósticos, sondagens, snapshots de uso)
title: openclaw status
x-i18n:
    generated_at: "2026-07-12T15:06:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
    source_path: cli/status.md
    workflow: 16
---

Diagnóstico de canais + sessões.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

| Opção                   | Descrição                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--all`                 | Diagnóstico completo (somente leitura, pronto para colar). Inclui auditoria de segurança, compatibilidade de plugins e verificações de vetores de memória. |
| `--deep`                | Executa verificações em tempo real (WhatsApp Web + Telegram + Discord + Slack + Signal). Também habilita a auditoria de segurança. |
| `--usage`               | Exibe as janelas normalizadas de uso do provedor como `X% left`.                                                         |
| `--json`                | Saída legível por máquina.                                                                                              |
| `--verbose` / `--debug` | Também exibe a resolução bruta do destino do Gateway antes do relatório.                                                |

O `openclaw status` simples permanece no caminho rápido e somente leitura e marca a memória como
`not checked` em vez de indisponível quando ignora a inspeção da memória. As verificações mais pesadas de
auditoria de segurança, compatibilidade de plugins e vetores de memória ficam a cargo de
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`
e `openclaw memory status --deep`.

## Resolução de sessão e modelo

- A saída de status da sessão separa `Execution:` de `Runtime:`. `Execution`
  é o caminho do sandbox (`direct`, `docker/*`), enquanto `Runtime` informa
  se a sessão está usando `OpenClaw Default`, `OpenAI Codex`, um backend de
  CLI ou um backend ACP, como `codex (acp/acpx)`. Consulte
  [Runtimes de agente](/pt-BR/concepts/agent-runtimes) para entender a distinção
  entre provedor, modelo e runtime.
- Quando o snapshot da sessão atual contém poucos dados, `/status` pode
  preencher os contadores de tokens e cache usando o registro de uso mais
  recente da transcrição. Valores ativos diferentes de zero continuam
  tendo precedência sobre os valores de fallback da transcrição.
- O fallback da transcrição também pode recuperar o rótulo do modelo de
  runtime ativo quando ele estiver ausente na entrada da sessão ativa. Se
  esse modelo da transcrição for diferente do modelo selecionado, o status
  resolve a janela de contexto com base no modelo de runtime recuperado,
  em vez do modelo selecionado.
- Para contabilizar o tamanho do prompt, o fallback da transcrição prefere
  o maior total relacionado ao prompt quando os metadados da sessão estão
  ausentes ou apresentam um valor menor, evitando que sessões de provedores
  personalizados sejam reduzidas a exibições de `0` tokens.
- Quando uma sessão está fixada em um modelo diferente do principal
  configurado, o status exibe ambos os valores, o motivo (`session override`)
  e a dica `/model default`. O principal configurado se aplica a sessões
  novas ou não fixadas; sessões já fixadas mantêm a seleção da sessão até
  que ela seja removida.
- A saída inclui armazenamentos de sessões por agente quando vários agentes
  estão configurados.

## Uso e cota

- `--usage` exibe as janelas normalizadas de uso do provedor no formato
  `X% left`.
- Os campos brutos `usage_percent` / `usagePercent` da MiniMax representam
  a cota restante, portanto, o OpenClaw os inverte antes da exibição; os
  campos baseados em contagem têm precedência quando estão presentes. As
  respostas de `model_remains` dão preferência à entrada do modelo de chat,
  derivam o rótulo da janela dos carimbos de data e hora quando necessário
  e incluem o nome do modelo no rótulo do plano.
- Falhas na atualização dos preços dos modelos são exibidas como avisos
  opcionais de preços. Elas não significam que o Gateway ou os canais não
  estejam íntegros.

## Visão geral e status de atualização

- A Visão geral inclui o status de instalação/execução do Gateway + serviço host do Node quando
  disponível, além do tempo de atividade resumido do processo do Gateway e do sistema host.
- A Visão geral inclui o canal de atualização + SHA do git (para checkouts do código-fonte).
- As informações de atualização aparecem na Visão geral; se houver uma atualização disponível, o status
  exibe uma dica para executar `openclaw update` (consulte [Atualização](/pt-BR/install/updating)).

## Segredos

- As superfícies de status somente leitura (`status`, `status --json`, `status --all`)
  resolvem SecretRefs compatíveis para os caminhos de configuração aos quais se destinam quando
  possível.
- Se um SecretRef de canal compatível estiver configurado, mas indisponível no
  caminho atual do comando, o status permanece somente leitura e informa uma saída degradada
  em vez de falhar. A saída para humanos exibe avisos como "o token configurado
  não está disponível neste caminho do comando", e a saída JSON inclui
  `secretDiagnostics`.
- Quando a resolução de SecretRef local ao comando é bem-sucedida, o status prioriza o
  snapshot resolvido e remove da saída final os marcadores transitórios de canal
  "segredo indisponível".
- `status --all` inclui uma linha de visão geral dos Segredos e uma seção de diagnóstico
  que resume os diagnósticos de segredos (truncados para facilitar a leitura) sem
  interromper a geração do relatório.

## Memória

`status --json --all` informa detalhes da memória fornecidos pelo runtime do Plugin de memória ativa
selecionado por `plugins.slots.memory`. Plugins de memória personalizados podem manter
`agents.defaults.memorySearch.enabled` integrado desabilitado e ainda informar
seus próprios arquivos, fragmentos, vetores e estado de FTS.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor](/pt-BR/gateway/doctor)
