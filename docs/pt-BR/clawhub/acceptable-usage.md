---
read_when:
    - Analisando envios em busca de abuso ou violações de políticas
    - Redação de documentação de moderação ou guias operacionais para revisores
    - Decidir se uma Skill deve ser ocultada ou um usuário banido
summary: 'Política do marketplace: o que o ClawHub permite e o que ele não hospedará.'
x-i18n:
    generated_at: "2026-05-11T20:22:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceitável

Esta página descreve os tipos de Skills e conteúdo que o ClawHub aceita, e os fluxos de abuso que ele não hospedará.

Estas regras são intencionalmente práticas. O que mais importa para nós são fluxos de abuso de ponta a ponta, não apenas palavras-chave isoladas. Se uma Skill é criada para driblar defesas, abusar de plataformas, aplicar golpes, invadir privacidade ou viabilizar comportamento sem consentimento, ela não pertence ao ClawHub.

## Padrões recentes que aceitamos explicitamente

- Trabalho de frontend e sistema de design que usa componentes reais, tokens semânticos, estados acessíveis e fluxos de usuário testados.
- Composição com shadcn/ui que usa componentes de origem instalados, aliases de projeto e variantes documentadas em vez de marcação pontual.
- Conversão de UI5 JavaScript para TypeScript que preserva comentários, usa tipos UI5 concretos e mantém interfaces de controle geradas revisáveis.
- Revisão de segurança defensiva, ferramentas de moderação e prompts de detecção de abuso que mostram evidências e mantêm claros os limites de aprovação humana.
- Automação de fluxos de trabalho baseada em consentimento para contas pessoais ou de equipe, com credenciais explícitas, configuração transparente e modos de simulação ou pré-visualização.
- Documentação, runbooks de migração, utilitários para desenvolvedores e fixtures de teste com escopo limitado ao software que oferecem suporte.

## Não aceitamos

- Fluxos de trabalho de bypass de segurança ou acesso não autorizado.
  - Exemplos: bypass de autenticação, tomada de conta, bypass de CAPTCHA, evasão de Cloudflare ou anti-bot, bypass de limite de taxa, scraping furtivo projetado para derrotar proteções, tomada de chamada ao vivo ou de agente, roubo reutilizável de sessão, aprovação automática de fluxos de pareamento para usuários não aprovados.

- Abuso de plataforma e evasão de banimento.
  - Exemplos: contas furtivas após banimentos, aquecimento ou cultivo de contas, engajamento falso, cultivo de karma ou seguidores, automação de múltiplas contas, publicações em massa, bots de spam, automação de marketplace ou redes sociais criada para evitar detecção.

- Fraude, golpes e fluxos financeiros enganosos.
  - Exemplos: certificados falsos, faturas falsas, fluxos de pagamento enganosos, abordagem para golpes, prova social falsa, ferramentas que viabilizam gastos ou cobranças sem aprovação humana clara e controles transparentes, ou fluxos de identidade sintética criados para criar contas para fraude.

- Scraping, enriquecimento ou vigilância invasivos à privacidade.
  - Exemplos: scraping de dados de contato em escala para spam, doxxing, stalking, extração de leads combinada com contato não solicitado, monitoramento encoberto, busca facial ou correspondência biométrica usada sem consentimento claro, ou compra, publicação, download ou operacionalização de dados vazados ou dumps de violações.

- Impersonação sem consentimento ou manipulação enganosa de identidade.
  - Exemplos: troca de rosto, gêmeos digitais, personas falsas, influenciadores clonados ou outras ferramentas de manipulação de identidade usadas para personificar ou enganar.

- Conteúdo sexual explícito e geração adulta com segurança desativada.
  - Exemplos: geração de imagens/vídeos/conteúdo NSFW, wrappers de conteúdo adulto em torno de APIs de terceiros ou Skills cujo objetivo principal é conteúdo sexual explícito.

- Requisitos de execução ocultos, inseguros ou enganosos.
  - Exemplos: comandos de instalação ofuscados, `curl | sh`, requisitos de segredo não declarados, uso não declarado de chave privada, execução remota de `npx @latest` sem revisabilidade clara, metadados enganosos que ocultam o que a Skill realmente precisa para executar.

## Padrões recentes que explicitamente não aceitamos

- “Criar contas de vendedor furtivas após banimentos em marketplace.”
- “Modificar o pareamento do Telegram para que usuários não aprovados recebam códigos de pareamento automaticamente.”
- “Cultivar contas do Reddit/Twitter com automação indetectável.”
- “Gerar certificados profissionais ou faturas para uso arbitrário.”
- “Gerar conteúdo NSFW com verificações de segurança desativadas.”
- “Coletar leads por scraping, enriquecer contatos e lançar abordagens frias em escala.”
- “Comprar, publicar ou baixar dados vazados ou dumps de violações.”
- “Criar contas de e-mail ou redes sociais em massa com identidades sintéticas ou resolução de CAPTCHA.”

## Observações para revisores

- O contexto importa. O mesmo tema pode ser legítimo em um cenário defensivo restrito ou baseado em consentimento e inaceitável quando empacotado como um fluxo de abuso.
- Devemos tender à ação quando uma Skill é claramente otimizada para evasão, engano ou uso sem consentimento.
- Uploads repetidos nessas categorias são motivo para ocultar conteúdo e banir a conta.

## Aplicação

- Podemos ocultar, remover ou excluir definitivamente Skills em violação.
- Podemos revogar tokens, excluir logicamente conteúdo associado e banir infratores reincidentes ou graves.
- Não garantimos aplicação com aviso prévio para abuso óbvio.
