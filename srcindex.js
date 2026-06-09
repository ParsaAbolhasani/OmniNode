// کتابخانه‌های لازم را import می‌کنیم (روش مدرن ES Module)
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'
import { ping } from '@libp2p/ping'
import { multiaddr } from '@multiaddr'

// این تابع اصلی است که گره ما را اجرا می‌کند
async function startNode() {
    // 1. گره libp2p را با اجزای مختلف پیکربندی می‌کنیم
    const node = await createLibp2p({
        // آدرس‌هایی که گره به آنها گوش می‌دهد (همه اینترفیس‌ها، پورت 9000)
        addresses: {
            listen: ['/ip4/0.0.0.0/tcp/9000']
        },
        // لایه انتقال: چگونه داده‌ها منتقل شوند؟ در اینجا از TCP استفاده می‌کنیم
        transports: [tcp()],
        // لایه امنیت: چگونه ارتباط را رمزگذاری کنیم؟ Noise یک پروتکل استاندارد است
        connectionEncryptors: [noise()],
        // لایه مالتی پلکسینگ: چگونه چندین استریم را روی یک کانال واحد مدیریت کنیم؟
        streamMuxers: [mplex()],
        // پروتکل‌های کاربردی: این گره چه کارهایی می‌تواند انجام دهد؟ در اینجا پروتکل Ping
        services: {
            ping: ping()
        }
    })

    // 2. گره را استارت می‌زنیم
    await node.start()
    console.log('✅ P2P Node started successfully!')
    console.log(`🆔 Peer ID: ${node.peerId.toString()}`)

    // آدرس‌هایی را که گره روی آنها در حال گوش دادن است، نمایش می‌دهد
    const addrs = node.getMultiaddrs()
    console.log('📡 Listening on addresses:')
    addrs.forEach(addr => {
        console.log(`   ${addr.toString()}/p2p/${node.peerId.toString()}`)
    })

    // 3. اگر یک آدرس به عنوان آرگومان به اسکریپت داده شد، سعی می‌کنیم به آن گره متصل شویم
    const destination = process.argv[2]
    if (destination) {
        console.log(`\n🔗 Attempting to connect to: ${destination}`)
        const ma = multiaddr(destination)
        await node.dial(ma)
        console.log('✅ Connected to peer!')
    } else {
        console.log('\n💡 To connect another node to this one, run:')
        console.log(`   node src/index.js ${addrs[0].toString()}/p2p/${node.peerId.toString()}`)
    }

    // 4. مدیریت خروج از برنامه (graceful shutdown)
    const gracefulShutdown = async () => {
        console.log('\n🛑 Shutting down node...')
        await node.stop()
        process.exit(0)
    }
    process.on('SIGINT', gracefulShutdown)
    process.on('SIGTERM', gracefulShutdown)
}

// تابع اصلی را اجرا می‌کنیم و خطاها را مدیریت می‌نماییم
startNode().catch(err => {
    console.error('❌ Failed to start node:', err)
    process.exit(1)
})