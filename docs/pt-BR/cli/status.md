---
read_when:
    - Você quer um diagnóstico rápido da integridade dos canais e dos destinatários das sessões recentes
    - Você quer um status "all" que possa ser colado para depuração
summary: Referência da CLI para `openclaw status` (diagnósticos, sondagens, instantâneos de uso)
title: openclaw status
x-i18n:
    generated_at: "2026-07-11T23:50:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
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

| Opção                   | Descrição                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--all`                 | Diagnóstico completo (somente leitura, adequado para colar). Inclui auditoria de segurança, compatibilidade de plugins e verificações de vetores de memória. |
| `--deep`                | Executa verificações em tempo real (WhatsApp Web + Telegram + Discord + Slack + Signal). Também habilita a auditoria de segurança. |
| `--usage`               | Exibe as janelas normalizadas de uso do provedor como `X% restante`.                                                        |
| `--json`                | Saída legível por máquina.                                                                                                  |
| `--verbose` / `--debug` | Também exibe a resolução bruta do destino do Gateway antes do relatório.                                                    |

O `openclaw status` simples permanece no caminho rápido e somente leitura e marca a memória como
`não verificada`, em vez de indisponível, quando ignora a inspeção da memória. As verificações
mais pesadas de auditoria de segurança, compatibilidade de plugins e vetores de memória ficam a cargo de
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`
e `openclaw memory status --deep`.

## Resolução de sessão e modelo

- A saída de status da sessão separa `Execução:` de `Runtime:`. `Execução`
  é o caminho do sandbox (`direct`, `docker/*`), enquanto `Runtime` informa
  se a sessão está usando `OpenClaw Default`, `OpenAI Codex`, um backend de
  CLI ou um backend ACP, como `codex (acp/acpx)`. Consulte
  [Runtimes de agentes](/pt-BR/concepts/agent-runtimes) para entender a distinção
  entre provedor, modelo e runtime.
- Quando o instantâneo da sessão atual contém poucos dados, `/status` pode preencher
  os contadores de tokens e cache com base no log de uso da transcrição mais recente. Os valores
  atuais diferentes de zero continuam tendo precedência sobre os valores de fallback da transcrição.
- O fallback da transcrição também pode recuperar o rótulo do modelo de runtime ativo quando
  ele não estiver presente na entrada da sessão em tempo real. Se esse modelo da transcrição for diferente
  do modelo selecionado, o status resolve a janela de contexto em relação ao
  modelo de runtime recuperado, e não ao selecionado.
- Para contabilizar o tamanho do prompt, o fallback da transcrição dá preferência ao maior
  total relacionado ao prompt quando os metadados da sessão estiverem ausentes ou forem menores, para que
  sessões de provedores personalizados não sejam reduzidas a exibições de `0` tokens.
- Quando uma sessão está fixada em um modelo diferente do principal
  configurado, o status exibe ambos os valores, o motivo (`substituição da sessão`) e
  a dica `/model default`. O modelo principal configurado se aplica a sessões novas ou
  não fixadas; sessões existentes fixadas mantêm sua seleção de sessão
  até que ela seja removida.
- A saída inclui armazenamentos de sessões por agente quando vários agentes estão
  configurados.

## Uso e cota

- `--usage` exibe as janelas normalizadas de uso do provedor como `X% restante`.
- Os campos brutos `usage_percent` / `usagePercent` da MiniMax representam a cota restante,
  portanto, o OpenClaw os inverte antes da exibição; campos baseados em contagem têm precedência quando
  presentes. Respostas `model_remains` dão preferência à entrada do modelo de chat, derivam o
  rótulo da janela com base nos carimbos de data e hora quando necessário e incluem o nome do modelo no
  rótulo do plano.
- Falhas na atualização de preços dos modelos são exibidas como avisos opcionais de preços.
  Elas não significam que o Gateway ou os canais estejam com problemas.

## Visão geral e status de atualização

- A visão geral inclui o status de instalação/runtime dos serviços de host do Gateway + Node quando
  disponível, além do tempo de atividade compacto do processo do Gateway e do sistema host.
- A visão geral inclui o canal de atualização + SHA do Git (para checkouts do código-fonte).
- As informações de atualização aparecem na visão geral; se houver uma atualização disponível, o status
  exibe uma dica para executar `openclaw update` (consulte [Atualização](/pt-BR/install/updating)).

## Segredos

- As superfícies de status somente leitura (`status`, `status --json`, `status --all`)
  resolvem SecretRefs compatíveis para os caminhos de configuração de destino quando
  possível.
- Se uma SecretRef de canal compatível estiver configurada, mas indisponível no
  caminho do comando atual, o status permanece somente leitura e relata uma saída
  degradada em vez de falhar. A saída para pessoas exibe avisos como "token configurado
  indisponível neste caminho de comando", e a saída JSON inclui
  `secretDiagnostics`.
- Quando a resolução de SecretRef local do comando é bem-sucedida, o status dá preferência ao
  instantâneo resolvido e remove os marcadores transitórios de canal "segredo indisponível"
  da saída final.
- `status --all` inclui uma linha de visão geral de segredos e uma seção de diagnóstico
  que resume os diagnósticos de segredos (truncados para facilitar a leitura) sem
  interromper a geração do relatório.

## Memória

`status --json --all` relata detalhes da memória com base no runtime do plugin de memória ativo
selecionado por `plugins.slots.memory`. Plugins de memória personalizados podem manter
`agents.defaults.memorySearch.enabled` desabilitado e ainda relatar
seus próprios arquivos, fragmentos, vetores e estado de FTS.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor](/pt-BR/gateway/doctor)
