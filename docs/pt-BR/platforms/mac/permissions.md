---
read_when:
    - Depuração de prompts de permissão do macOS ausentes ou travados
    - Decidindo se deve conceder Acessibilidade ao node ou a um runtime de CLI
    - Empacotando ou assinando o aplicativo macOS
    - Alterando IDs de bundle ou caminhos de instalação do app
summary: Persistência de permissões do macOS (TCC) e requisitos de assinatura
title: Permissões do macOS
x-i18n:
    generated_at: "2026-06-27T17:43:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b7e21c53bff16c3023e2b6509894717c3d0ef96524951b0d0c5975d2fc91019
    source_path: platforms/mac/permissions.md
    workflow: 16
---

As concessões de permissão do macOS são frágeis. O TCC associa uma concessão de permissão à
assinatura de código do app, ao identificador do pacote e ao caminho em disco. Se qualquer um deles mudar,
o macOS trata o app como novo e pode descartar ou ocultar prompts.

## Requisitos para permissões estáveis

- Mesmo caminho: execute o app a partir de um local fixo (para OpenClaw, `dist/OpenClaw.app`).
- Mesmo identificador do pacote: alterar o ID do pacote cria uma nova identidade de permissão.
- App assinado: compilações não assinadas ou assinadas ad hoc não persistem permissões.
- Assinatura consistente: use um certificado real Apple Development ou Developer ID
  para que a assinatura permaneça estável entre recompilações.

Assinaturas ad hoc geram uma nova identidade a cada compilação. O macOS esquecerá concessões
anteriores, e os prompts podem desaparecer completamente até que as entradas obsoletas sejam limpas.

## Concessões de Acessibilidade para runtimes Node e CLI

Prefira conceder Acessibilidade ao OpenClaw.app, Peekaboo.app ou outro auxiliar assinado
com seu próprio identificador de pacote em vez de um binário `node` genérico.

O TCC do macOS concede Acessibilidade à identidade de código do processo que ele vê. Se um
fluxo de trabalho Homebrew, nvm, pnpm ou npm fizer com que um executável `node` compartilhado
receba Acessibilidade, qualquer pacote JavaScript iniciado por meio desse mesmo
executável poderá herdar privilégios de automação de GUI.

Trate uma entrada `node` nos Ajustes do Sistema como permissão ampla para esse runtime
Node, não como permissão para um pacote npm. Evite conceder Acessibilidade ao
`node` a menos que você confie em todos os scripts e pacotes iniciados por meio dessa instalação
Node exata.

Se você concedeu Acessibilidade ao `node` por acidente, remova essa entrada de
Ajustes do Sistema -> Privacidade e Segurança -> Acessibilidade. Em seguida, conceda ao app ou
auxiliar assinado que deve ser responsável pela automação de UI.

## Lista de verificação de recuperação quando os prompts desaparecem

1. Encerre o app.
2. Remova a entrada do app em Ajustes do Sistema -> Privacidade e Segurança.
3. Reinicie o app a partir do mesmo caminho e conceda as permissões novamente.
4. Se o prompt ainda não aparecer, redefina as entradas do TCC com `tccutil` e tente novamente.
5. Algumas permissões só reaparecem após uma reinicialização completa do macOS.

Exemplos de redefinições (substitua o ID do pacote conforme necessário):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Permissões de arquivos e pastas (Mesa/Documentos/Downloads)

O macOS também pode bloquear Mesa, Documentos e Downloads para processos de terminal/em segundo plano. Se leituras de arquivos ou listagens de diretórios travarem, conceda acesso ao mesmo contexto de processo que executa as operações de arquivo (por exemplo, Terminal/iTerm, app iniciado por LaunchAgent ou processo SSH).

Solução alternativa: mova os arquivos para o workspace do OpenClaw (`~/.openclaw/workspace`) se quiser evitar concessões por pasta.

Se estiver testando permissões, sempre assine com um certificado real. Compilações ad hoc
só são aceitáveis para execuções locais rápidas em que permissões não importam.

## Relacionados

- [app macOS](/pt-BR/platforms/macos)
- [assinatura do macOS](/pt-BR/platforms/mac/signing)
