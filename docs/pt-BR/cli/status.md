---
read_when:
    - Você quer um diagnóstico rápido da integridade do canal + destinatários recentes da sessão
    - Você quer um status “all” copiável para depuração
summary: Referência da CLI para `openclaw status` (diagnósticos, probes, snapshots de uso)
title: Status
x-i18n:
    generated_at: "2026-04-24T05:46:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 369de48e283766ec23ef87f79df39893957101954c4a351e46ef24104d78ec1d
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnósticos para canais + sessões.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Observações:

- `--deep` executa probes ao vivo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` imprime janelas de uso normalizadas como `X% left`.
- A saída de status da sessão agora separa `Runtime:` de `Runner:`. `Runtime` é o caminho de execução e o estado do sandbox (`direct`, `docker/*`), enquanto `Runner` informa se a sessão está usando Pi incorporado, um provedor com suporte de CLI ou um backend de harness ACP como `codex (acp/acpx)`.
- Os campos brutos `usage_percent` / `usagePercent` do MiniMax representam a cota restante, então o OpenClaw os inverte antes da exibição; campos baseados em contagem prevalecem quando presentes. Respostas `model_remains` preferem a entrada do modelo de chat, derivam o rótulo da janela a partir de timestamps quando necessário e incluem o nome do modelo no rótulo do plano.
- Quando o snapshot da sessão atual é esparso, `/status` pode preencher contadores de tokens e cache a partir do log de uso da transcrição mais recente. Valores ativos não zero existentes ainda prevalecem sobre valores de fallback da transcrição.
- O fallback da transcrição também pode recuperar o rótulo do modelo de runtime ativo quando a entrada da sessão ao vivo não o tiver. Se esse modelo da transcrição diferir do modelo selecionado, o status resolve a janela de contexto com base no modelo de runtime recuperado em vez do modelo selecionado.
- Para contabilidade de tamanho de prompt, o fallback da transcrição prefere o total orientado a prompt maior quando os metadados da sessão estão ausentes ou menores, para que sessões de provedor personalizado não caiam para exibições de `0` token.
- A saída inclui armazenamentos de sessão por agente quando múltiplos agentes estão configurados.
- A visão geral inclui status de instalação/runtime do serviço de host do Gateway + Node quando disponível.
- A visão geral inclui canal de atualização + SHA do git (para checkouts do código-fonte).
- As informações de atualização aparecem na visão geral; se uma atualização estiver disponível, o status imprime uma dica para executar `openclaw update` (consulte [Atualizando](/pt-BR/install/updating)).
- Superfícies de status somente leitura (`status`, `status --json`, `status --all`) resolvem SecretRefs compatíveis para seus caminhos de configuração direcionados quando possível.
- Se um SecretRef de canal compatível estiver configurado, mas indisponível no caminho de comando atual, o status permanece somente leitura e relata uma saída degradada em vez de falhar. A saída legível por humanos mostra avisos como “configured token unavailable in this command path”, e a saída JSON inclui `secretDiagnostics`.
- Quando a resolução local de SecretRef do comando é bem-sucedida, o status prefere o snapshot resolvido e limpa marcadores transitórios de canal “secret unavailable” da saída final.
- `status --all` inclui uma linha de visão geral de Secrets e uma seção de diagnóstico que resume diagnósticos de segredo (truncados para legibilidade) sem interromper a geração do relatório.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor](/pt-BR/gateway/doctor)
