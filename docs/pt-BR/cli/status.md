---
read_when:
    - Você quer um diagnóstico rápido da integridade do canal + destinatários recentes da sessão
    - Você quer um status “todos” pronto para colar para depuração
summary: Referência da CLI para `openclaw status` (diagnósticos, sondagens, instantâneos de uso)
title: openclaw status
x-i18n:
    generated_at: "2026-05-06T05:49:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1929db64f09e9494736f09d0d9c1ae1fb72d7308a7124e616e8247ff32aa3185
    source_path: cli/status.md
    workflow: 16
---

Diagnósticos para canais + sessões.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Observações:

- `--deep` executa sondagens ao vivo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` simples permanece no caminho rápido somente leitura e marca a memória como `not checked` em vez de indisponível quando pula a inspeção de memória. Auditoria de segurança pesada, compatibilidade de plugins e sondagens de vetor de memória ficam para `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` e `openclaw memory status --deep`.
- `status --json --all` relata detalhes de memória do runtime do plugin de memória ativo selecionado por `plugins.slots.memory`. Plugins de memória personalizados podem deixar o `agents.defaults.memorySearch.enabled` integrado desativado e ainda relatar seus próprios arquivos, chunks, vetor e estado de FTS.
- `--usage` imprime janelas normalizadas de uso do provedor como `X% left`.
- A saída de status da sessão separa `Execution:` de `Runtime:`. `Execution` é o caminho do sandbox (`direct`, `docker/*`), enquanto `Runtime` informa se a sessão está usando `OpenClaw Pi Default`, `OpenAI Codex`, um backend de CLI ou um backend ACP como `codex (acp/acpx)`. Consulte [Runtimes de agente](/pt-BR/concepts/agent-runtimes) para a distinção entre provedor/modelo/runtime.
- Os campos brutos `usage_percent` / `usagePercent` do MiniMax representam cota restante, então o OpenClaw os inverte antes da exibição; campos baseados em contagem têm prioridade quando presentes. Respostas de `model_remains` preferem a entrada do modelo de chat, derivam o rótulo da janela a partir de timestamps quando necessário e incluem o nome do modelo no rótulo do plano.
- Quando o snapshot da sessão atual é esparso, `/status` pode preencher contadores de tokens e cache a partir do log de uso de transcrição mais recente. Valores ao vivo diferentes de zero existentes ainda têm prioridade sobre valores de fallback da transcrição.
- `/status` inclui uptime compacto do processo do Gateway e uptime do sistema host.
- O fallback de transcrição também pode recuperar o rótulo do modelo do runtime ativo quando a entrada da sessão ao vivo não o contém. Se esse modelo da transcrição for diferente do modelo selecionado, o status resolve a janela de contexto em relação ao modelo de runtime recuperado, em vez do selecionado.
- Para contabilização do tamanho do prompt, o fallback de transcrição prefere o maior total orientado a prompt quando os metadados da sessão estão ausentes ou são menores, para que sessões de provedores personalizados não colapsem para exibições de `0` token.
- A saída inclui armazenamentos de sessão por agente quando vários agentes estão configurados.
- A visão geral inclui o status de instalação/runtime do serviço host do Gateway + Node quando disponível.
- A visão geral inclui canal de atualização + SHA do git (para checkouts do código-fonte).
- Informações de atualização aparecem na visão geral; se houver uma atualização disponível, o status imprime uma dica para executar `openclaw update` (consulte [Atualizando](/pt-BR/install/updating)).
- Superfícies de status somente leitura (`status`, `status --json`, `status --all`) resolvem SecretRefs compatíveis para seus caminhos de configuração direcionados quando possível.
- Se um SecretRef de canal compatível estiver configurado, mas indisponível no caminho do comando atual, o status permanece somente leitura e relata saída degradada em vez de falhar. A saída humana mostra avisos como "token configurado indisponível neste caminho de comando", e a saída JSON inclui `secretDiagnostics`.
- Quando a resolução de SecretRef local ao comando é bem-sucedida, o status prefere o snapshot resolvido e limpa marcadores transitórios de "segredo indisponível" do canal na saída final.
- `status --all` inclui uma linha de visão geral de segredos e uma seção de diagnóstico que resume diagnósticos de segredos (truncados para legibilidade) sem interromper a geração do relatório.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Doctor](/pt-BR/gateway/doctor)
