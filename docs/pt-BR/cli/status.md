---
read_when:
    - Você quer um diagnóstico rápido da integridade do canal + destinatários recentes da sessão
    - Você quer um status “all” para depuração que possa ser colado
summary: Referência da CLI para `openclaw status` (diagnósticos, sondagens, instantâneos de uso)
title: Status
x-i18n:
    generated_at: "2026-04-30T09:43:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a85613e1830dc24253847e6517d3e155c175bb39ff6b01031ac5cb4291e276fa
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

Diagnósticos para canais + sessões.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Notas:

- `--deep` executa sondagens ao vivo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` simples permanece no caminho rápido somente leitura e marca a memória como `not checked` em vez de indisponível quando pula a inspeção de memória. Auditoria de segurança pesada, compatibilidade de plugins e sondagens de vetores de memória ficam para `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` e `openclaw memory status --deep`.
- `status --json --all` relata detalhes de memória do runtime do Plugin de memória ativo selecionado por `plugins.slots.memory`. Plugins de memória personalizados podem deixar o `agents.defaults.memorySearch.enabled` integrado desabilitado e ainda relatar seus próprios arquivos, chunks, vetores e estado de FTS.
- `--usage` imprime janelas normalizadas de uso do provedor como `X% left`.
- A saída de status da sessão separa `Execution:` de `Runtime:`. `Execution` é o caminho de sandbox (`direct`, `docker/*`), enquanto `Runtime` informa se a sessão está usando `OpenClaw Pi Default`, `OpenAI Codex`, um backend de CLI ou um backend ACP, como `codex (acp/acpx)`. Consulte [Runtimes de agentes](/pt-BR/concepts/agent-runtimes) para ver a distinção entre provedor/modelo/runtime.
- Os campos brutos `usage_percent` / `usagePercent` do MiniMax são a cota restante, então o OpenClaw os inverte antes da exibição; campos baseados em contagem prevalecem quando presentes. Respostas de `model_remains` dão preferência à entrada de modelo de chat, derivam o rótulo da janela a partir de timestamps quando necessário e incluem o nome do modelo no rótulo do plano.
- Quando o snapshot da sessão atual é esparso, `/status` pode preencher contadores de tokens e cache a partir do log de uso da transcrição mais recente. Valores ao vivo existentes e não zero ainda prevalecem sobre valores de fallback da transcrição.
- O fallback da transcrição também pode recuperar o rótulo do modelo de runtime ativo quando a entrada da sessão ao vivo não o contém. Se esse modelo da transcrição for diferente do modelo selecionado, o status resolve a janela de contexto em relação ao modelo de runtime recuperado, em vez do selecionado.
- Para contabilização do tamanho do prompt, o fallback da transcrição prefere o total maior orientado a prompt quando os metadados da sessão estão ausentes ou são menores, para que sessões de provedores personalizados não caiam para exibições de `0` tokens.
- A saída inclui stores de sessão por agente quando vários agentes estão configurados.
- A visão geral inclui o status de instalação/runtime do Gateway + serviço de host do node quando disponível.
- A visão geral inclui canal de atualização + SHA do git (para checkouts de código-fonte).
- Informações de atualização aparecem na Visão geral; se houver uma atualização disponível, o status imprime uma dica para executar `openclaw update` (consulte [Atualização](/pt-BR/install/updating)).
- Superfícies de status somente leitura (`status`, `status --json`, `status --all`) resolvem SecretRefs compatíveis para seus caminhos de configuração direcionados quando possível.
- Se um SecretRef de canal compatível estiver configurado, mas indisponível no caminho do comando atual, o status permanece somente leitura e relata saída degradada em vez de travar. A saída humana mostra avisos como “token configurado indisponível neste caminho de comando”, e a saída JSON inclui `secretDiagnostics`.
- Quando a resolução de SecretRef local ao comando é bem-sucedida, o status prefere o snapshot resolvido e limpa marcadores transitórios de “secret indisponível” do canal na saída final.
- `status --all` inclui uma linha de visão geral de Segredos e uma seção de diagnóstico que resume diagnósticos de segredos (truncados para facilitar a leitura) sem interromper a geração do relatório.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor](/pt-BR/gateway/doctor)
