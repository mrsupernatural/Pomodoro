import { useState } from 'react'

type Step = {
  icon: string
  title: string
  description: string
  path?: string
  screenshot?: string
  tip?: string
}

const settingsSteps: Step[] = [
  {
    icon: '⚙️',
    title: 'Repo Ayarlarına Girin',
    description: 'GitHub\'da reponuzu açın ve üst menüdeki "Settings" (Ayarlar) sekmesine tıklayın.',
    path: 'github.com/kullanici/repo → Settings sekmesi',
    tip: 'Settings sekmesi en sağdaki sekmelerden biridir. Dişli çark ikonu ile bulunabilir.'
  },
  {
    icon: '👥',
    title: 'Collaborators Bölümüne Gidin',
    description: 'Sol menüden "Collaborators and teams" seçeneğine tıklayın. Burada repo\'ya erişimi olan tüm kullanıcıları göreceksiniz.',
    path: 'Settings → Collaborators and teams',
    tip: 'Eğer qwen-intl bir GitHub hesabı ise ve burada listeleniyorsa, yanındaki "Remove" butonuna basarak kaldırın.'
  },
  {
    icon: '🗑️',
    title: 'qwen-intl\'yi Kaldırın (Eğer Collaborator ise)',
    description: 'Listede qwen-intl kullanıcısını bulun. Sağ tarafındaki çöp kutusu veya "Remove" butonuna tıklayın. Çıkan onay penceresinde "Remove" butonuna basın.',
    path: 'Settings → Collaborators → qwen-intl → Remove',
    tip: 'Bu adım sadece qwen-intl\'yi collaborator olarak kaldırır. Geçmiş commit\'lerdeki author bilgisi değişmez.'
  },
  {
    icon: '🔒',
    title: 'Branch Protection Kuralları Ekleyin',
    description: 'Settings → Branches bölümüne gidin. "Add branch protection rule" butonuna tıklayarak ana branch\'inizi koruyun. Bu, yetkisiz commit\'leri engeller.',
    path: 'Settings → Branches → Add branch protection rule',
    tip: 'Branch adı olarak "main" veya "master" yazın. "Require pull request reviews before merging" seçeneğini aktif edin.'
  },
  {
    icon: '🤖',
    title: 'Actions & Automations Kontrolü',
    description: 'Settings → Actions → General bölümüne gidin. Burada otomatik olarak commit yapan workflow\'ları kontrol edin. Gerekirse devre dışı bırakın.',
    path: 'Settings → Actions → General',
    tip: 'Eğer bir GitHub Action qwen-intl adına commit yapıyorsa, workflow dosyasını (.github/workflows/) düzenleyin.'
  },
  {
    icon: '🔑',
    title: 'Deploy Keys & Access Tokens Kontrolü',
    description: 'Settings → Deploy keys ve Settings → Secrets and variables → Actions bölümlerini kontrol edin. qwen-intl ile ilişkili token varsa silin.',
    path: 'Settings → Deploy keys / Secrets and variables',
    tip: 'Bu token\'lar otomatik commit yapan araçların kullandığı kimlik bilgileri olabilir.'
  },
  {
    icon: '📊',
    title: 'Insights → Contributors Kontrolü',
    description: 'Artık Insights → Contributors sayfasına gidin. Eğer qwen-intl hâlâ görünüyorsa, geçmiş commit\'lerdeki author bilgisini değiştirmeniz gerekir (.mailmap veya git filter-repo ile).',
    path: 'Insights → Contributors',
    tip: 'GitHub bu sayfayı periyodik olarak günceller. Değişikliklerin yansıması 24 saate kadar sürebilir.'
  }
]

type Method = {
  id: string
  title: string
  difficulty: 'Kolay' | 'Orta' | 'Zor'
  risk: 'Düşük' | 'Orta' | 'Yüksek'
  description: string
  steps: string[]
  code?: string
  note?: string
}

const methods: Method[] = [
  {
    id: 'mailmap',
    title: '.mailmap Dosyası',
    difficulty: 'Kolay',
    risk: 'Düşük',
    description: 'Git\'in .mailmap özelliği ile commit yazarlarını yeniden eşleştirebilirsiniz. Bu yöntem git geçmişini değiştirmez, sadece gösterimi etkiler.',
    steps: [
      'Proje kök dizinine .mailmap adında bir dosya oluşturun',
      'qwen-intl\'nin kullandığı email adresini kendi email adresinize yönlendirin',
      'Dosyayı commit edip push edin',
      'GitHub\'ın cache\'i temizlemesi birkaç dakika sürebilir'
    ],
    code: `# .mailmap dosyası içeriği
# Format: Doğru İsim <doğru@email> Yanlış İsim <yanlış@email>

# qwen-intl'nin commit'lerini kendi adınıza yönlendirin:
Sizin Adınız <sizin@email.com> qwen-intl <qwen-intl@users.noreply.github.com>

# Eğer sadece isim farklıysa:
Sizin Adınız <sizin@email.com> qwen-intl`,
    note: '⚠️ Bu yöntem GitHub\'ın contributor sayfasında ismi değiştirir ancak bazı durumlarda tam olarak gizlenmeyebilir. GitHub\'ın cache sistemi nedeniyle değişiklik hemen görünmeyebilir.'
  },
  {
    id: 'filter-repo',
    title: 'git filter-repo',
    difficulty: 'Orta',
    risk: 'Yüksek',
    description: 'git-filter-repo aracı ile tüm git geçmişindeki author/committer bilgilerini değiştirebilirsiniz. Bu yöntem kalıcıdır ve tüm commit\'leri yeniden yazar.',
    steps: [
      'git-filter-repo aracını kurun: pip install git-filter-repo',
      'Repo\'nun tam bir klonunu alın (shallow clone değil!)',
      'Aşağıdaki komutu çalıştırarak author bilgilerini değiştirin',
      'Force push ile değişiklikleri GitHub\'a gönderin',
      'Diğer contributor\'lara repo\'yu yeniden klonlamalarını söyleyin'
    ],
    code: `# git-filter-repo kurulumu
pip install git-filter-repo

# Tüm commit'lerdeki qwen-intl author'unu kendinize yönlendirin
git filter-repo --mailmap .mailmap --force

# Veya doğrudan komut satırında:
git filter-repo --email-callback '
  if b"qwen-intl" in email:
    return b"sizin@email.com"
  return email
' --name-callback '
  if name == b"qwen-intl":
    return b"Sizin Adınız"
  return name
' --force

# Değişiklikleri GitHub'a gönderin
git push --force --all
git push --force --tags`,
    note: '⚠️ DİKKAT: Bu yöntem tüm commit hash\'lerini değiştirir. Eğer başka kişiler bu repo\'yu kullanıyorsa, herkesin repo\'yu yeniden klonlaması gerekir. Force push gerektirir ve geri alınamaz!'
  },
  {
    id: 'filter-branch',
    title: 'git filter-branch',
    difficulty: 'Zor',
    risk: 'Yüksek',
    description: 'git filter-branch, git-filter-repo\'nun eski versiyonudur. Hala çalışır ancak resmi olarak önerilmez.',
    steps: [
      'Repo\'nun tam klonunu alın',
      'Aşağıdaki filter-branch komutunu çalıştırın',
      'Force push yapın',
      'Reflog ve garbage collection temizliği yapın'
    ],
    code: `# git filter-branch ile author değiştirme
git filter-branch -f --env-filter '
if [ "$GIT_AUTHOR_EMAIL" = "qwen-intl@users.noreply.github.com" ]; then
    export GIT_AUTHOR_NAME="Sizin Adınız"
    export GIT_AUTHOR_EMAIL="sizin@email.com"
fi
if [ "$GIT_COMMITTER_EMAIL" = "qwen-intl@users.noreply.github.com" ]; then
    export GIT_COMMITTER_NAME="Sizin Adınız"
    export GIT_COMMITTER_EMAIL="sizin@email.com"
fi
' --tag-name-filter cat -- --all

# Force push
git push --force --all

# Temizlik
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now`,
    note: '⚠️ Bu yöntem artık önerilmemektedir. Mümkünse git-filter-repo kullanın.'
  }
]

function App() {
  const [activeTab, setActiveTab] = useState<'settings' | 'methods'>('settings')
  const [activeMethod, setActiveMethod] = useState<string>('mailmap')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [expandedStep, setExpandedStep] = useState<number | null>(0)

  const activeData = methods.find(m => m.id === activeMethod)!

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case 'Kolay': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Orta': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Zor': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getRiskColor = (r: string) => {
    switch (r) {
      case 'Düşük': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Orta': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Yüksek': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#161b22]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-white" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            <h1 className="text-2xl font-bold text-white">GitHub Contributors Gizleme Rehberi</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Insights sayfasında <code className="bg-gray-800 px-2 py-0.5 rounded text-orange-400">qwen-intl</code> gibi istenmeyen contributor'ları gizleme yöntemleri
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Answer */}
        <div className="bg-[#161b22] border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-yellow-400">⚡</span> Hızlı Cevap
          </h2>
          <p className="text-gray-300 leading-relaxed">
            GitHub'da Insights/Contributors kısmından bir kullanıcıyı <strong className="text-white">tamamen gizlemenin</strong> tek başına ayarlardan bir yolu <strong className="text-red-400">yoktur</strong>. 
            Ancak <strong className="text-blue-400">GitHub ayarlarından</strong> gelecekteki yetkisiz commit'leri engelleyebilir ve 
            <strong className="text-green-400"> .mailmap</strong> veya <strong className="text-yellow-400">git filter-repo</strong> ile geçmiş commit'leri düzeltebilirsiniz.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-[#161b22] border border-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            ⚙️ GitHub Ayarlarından Adım Adım
          </button>
          <button
            onClick={() => setActiveTab('methods')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === 'methods'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            🛠️ Geçmişi Düzeltme Yöntemleri
          </button>
        </div>

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2">⚙️ GitHub Ayarlarından Contributor Gizleme</h2>
              <p className="text-gray-400 text-sm">
                Aşağıdaki adımları sırasıyla takip ederek qwen-intl'nin repo'nuza yetkisiz erişimini engelleyin ve contributor listesinden kaldırma sürecini başlatın.
              </p>
            </div>

            {/* Important Notice */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 mb-8">
              <p className="text-red-300 text-sm font-medium mb-1">⚠️ Önemli Bilgi</p>
              <p className="text-red-200/70 text-sm">
                GitHub ayarlarından collaborator kaldırmak, <strong>gelecekteki</strong> commit'leri engeller. 
                Geçmişteki commit'ler hâlâ contributor sayfasında görünür. Tamamen gizlemek için alttaki "Geçmişi Düzeltme" sekmesine bakın.
              </p>
            </div>

            {/* Steps Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 hidden md:block"></div>

              <div className="space-y-4">
                {settingsSteps.map((step, index) => (
                  <div key={index} className="relative">
                    {/* Step card */}
                    <div
                      className={`md:ml-14 bg-[#161b22] border rounded-lg transition-all cursor-pointer ${
                        expandedStep === index
                          ? 'border-blue-500/50 shadow-lg shadow-blue-500/5'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                    >
                      {/* Step number circle */}
                      <div className="absolute left-0 top-4 w-12 h-12 rounded-full bg-[#161b22] border-2 border-blue-500 flex items-center justify-center text-xl hidden md:flex z-10">
                        {step.icon}
                      </div>

                      {/* Header */}
                      <div className="p-4 md:p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="md:hidden text-xl">{step.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-blue-400 font-mono">Adım {index + 1}</span>
                              </div>
                              <h3 className="text-white font-semibold mt-0.5">{step.title}</h3>
                            </div>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-500 transition-transform ${expandedStep === index ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>

                        {/* Expanded content */}
                        {expandedStep === index && (
                          <div className="mt-4 space-y-3">
                            <p className="text-gray-300 text-sm leading-relaxed">{step.description}</p>
                            
                            {step.path && (
                              <div className="bg-[#0d1117] border border-gray-700 rounded-md px-3 py-2">
                                <span className="text-xs text-gray-500 block mb-1">📍 Navigasyon:</span>
                                <code className="text-sm text-blue-400 font-mono">{step.path}</code>
                              </div>
                            )}

                            {step.tip && (
                              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-md px-3 py-2">
                                <span className="text-xs text-yellow-400">💡 İpucu:</span>
                                <p className="text-sm text-yellow-200/80 mt-1">{step.tip}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Guide - Settings Screenshot Mockup */}
            <div className="mt-8 bg-[#161b22] border border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-[#1c2128] border-b border-gray-700 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-gray-500 font-mono">github.com/kullanici/repo/settings</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex gap-6">
                  {/* Sidebar mockup */}
                  <div className="hidden md:block w-56 space-y-1">
                    {['General', 'Access', 'Collaborators and teams', 'Moderation', 'Branches', 'Tags', 'Rules', 'Actions', 'Webhooks', 'Environments', 'Codespaces', 'Pages'].map((item, i) => (
                      <div
                        key={item}
                        className={`px-3 py-1.5 rounded text-sm ${
                          item === 'Collaborators and teams'
                            ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  {/* Content mockup */}
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-4">Collaborators</h4>
                    <div className="space-y-2">
                      {/* User row */}
                      <div className="flex items-center justify-between bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">S</div>
                          <div>
                            <div className="text-sm text-white">sizin-kullanici-adiniz</div>
                            <div className="text-xs text-gray-500">Owner</div>
                          </div>
                        </div>
                      </div>
                      {/* qwen-intl row - being removed */}
                      <div className="flex items-center justify-between bg-red-500/5 border border-red-500/30 rounded-lg px-4 py-3 relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                        <div className="flex items-center gap-3 relative">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs font-bold">Q</div>
                          <div>
                            <div className="text-sm text-gray-400 line-through">qwen-intl</div>
                            <div className="text-xs text-red-400">Kaldırılacak</div>
                          </div>
                        </div>
                        <button className="relative bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded font-medium transition-colors">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* After settings - what to do next */}
            <div className="mt-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-3">📋 Ayarlardan Sonra Yapmanız Gerekenler</h3>
              <div className="text-gray-300 space-y-3">
                <p className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Yukarıdaki ayar adımlarını tamamladıktan sonra qwen-intl <strong className="text-white">gelecekte</strong> repo'nuza commit yapamaz.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">→</span>
                  <span>Ancak <strong className="text-white">geçmişteki commit'ler</strong> hâlâ Insights/Contributors sayfasında görünür.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">→</span>
                  <span>Tamamen gizlemek için üstteki <strong className="text-white">"Geçmişi Düzeltme Yöntemleri"</strong> sekmesine geçin.</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* METHODS TAB */}
        {activeTab === 'methods' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2">🛠️ Geçmişi Düzeltme Yöntemleri</h2>
              <p className="text-gray-400 text-sm">
                Bu yöntemler geçmiş commit'lerdeki author bilgisini değiştirerek qwen-intl'nin contributor sayfasından tamamen kaldırılmasını sağlar.
              </p>
            </div>

            {/* Method Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {methods.map(method => (
                <button
                  key={method.id}
                  onClick={() => setActiveMethod(method.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeMethod === method.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-[#161b22] text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-gray-200'
                  }`}
                >
                  {method.title}
                </button>
              ))}
            </div>

            {/* Active Method Detail */}
            <div className="bg-[#161b22] border border-gray-700 rounded-lg p-6">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h3 className="text-lg font-bold text-white">{activeData.title}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyColor(activeData.difficulty)}`}>
                  Zorluk: {activeData.difficulty}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getRiskColor(activeData.risk)}`}>
                  Risk: {activeData.risk}
                </span>
              </div>

              <p className="text-gray-300 mb-4">{activeData.description}</p>

              {/* Steps */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Adımlar</h4>
                <ol className="space-y-2">
                  {activeData.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-gray-300">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Code Block */}
              {activeData.code && (
                <div className="mb-6">
                  <div className="flex items-center justify-between bg-[#0d1117] border border-gray-700 rounded-t-lg px-4 py-2">
                    <span className="text-xs text-gray-500 font-mono">Terminal / .mailmap</span>
                    <button
                      onClick={() => copyCode(activeData.code!, activeData.id)}
                      className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      {copiedCode === activeData.id ? (
                        <>
                          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Kopyalandı!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Kopyala
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-[#0d1117] border border-t-0 border-gray-700 rounded-b-lg p-4 overflow-x-auto text-sm">
                    <code className="text-green-400 font-mono whitespace-pre">{activeData.code}</code>
                  </pre>
                </div>
              )}

              {/* Note */}
              {activeData.note && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                  <p className="text-yellow-200/80 text-sm">{activeData.note}</p>
                </div>
              )}
            </div>

            {/* Recommendation */}
            <div className="mt-8 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <span>✅</span> Hangi Yöntemi Seçmeliyim?
              </h3>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong className="text-green-400">Senaryo 1:</strong> Repo sadece sizin ise → 
                  <strong className="text-white"> git filter-repo</strong> kullanın. En temiz çözüm.
                </p>
                <p>
                  <strong className="text-green-400">Senaryo 2:</strong> Repo'da başka contributor'lar varsa → 
                  <strong className="text-white"> .mailmap</strong> kullanın. Geçmişi bozmaz.
                </p>
                <p>
                  <strong className="text-green-400">Senaryo 3:</strong> Eski bir repo ve filter-repo çalışmıyorsa → 
                  <strong className="text-white"> git filter-branch</strong> son çare olarak kullanılabilir.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Prevention Section - Always visible */}
        <div className="mt-8 bg-[#161b22] border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>🛡️</span> Gelecekte Önlemek İçin
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[#0d1117] border border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">Git Config Kontrolü</h4>
              <pre className="text-sm text-green-400 font-mono overflow-x-auto">
{`git config user.name "Adınız"
git config user.email "email@adres.com"

# Kontrol:
git config --list | grep user`}
              </pre>
            </div>
            <div className="bg-[#0d1117] border border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">Pre-commit Hook</h4>
              <pre className="text-sm text-green-400 font-mono overflow-x-auto">
{`# .git/hooks/pre-commit
#!/bin/sh
EMAIL=$(git config user.email)
if [ "$EMAIL" != "sizin@email.com" ]; then
  echo "Yanlış email: $EMAIL"
  exit 1
fi`}
              </pre>
            </div>
          </div>
        </div>

        {/* Why does this happen */}
        <div className="mt-8 bg-[#161b22] border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span>🤔</span> Neden qwen-intl Görünüyor?
          </h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            Eğer AI destekli bir araç (Qwen gibi) ile commit'ler oluşturduysanız veya bir bot/automation kullandıysanız, 
            commit'lerin author bilgisi <code className="bg-gray-800 px-2 py-0.5 rounded text-orange-400">qwen-intl</code> olarak kaydedilmiş olabilir. 
            GitHub, commit'lerdeki author email'ine göre contributor listesini oluşturur.
          </p>
          <div className="bg-[#0d1117] border border-gray-700 rounded p-4 font-mono text-sm">
            <div className="text-gray-500"># Commit author bilgisini kontrol edin:</div>
            <div className="text-green-400">git log --format="%an &lt;%ae&gt;" | sort | uniq -c | sort -rn</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Bu rehber genel bilgilendirme amaçlıdır. Git geçmişini değiştirmeden önce yedek almayı unutmayın.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
