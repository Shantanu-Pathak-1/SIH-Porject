import React, { useState } from 'react';
import { ShieldAlert, Send, Radio, MessageSquare, CheckCircle, Clock } from 'lucide-react';

export default function AlertFeed({ alerts = [], onTriggerManualAlert }) {
  const [recipient, setRecipient] = useState('+913642500000');
  const [message, setMessage] = useState('MANUAL EMERGENCY OVERRIDE: Evacuate slope Sector B4 immediately due to heavy rainfall.');
  const [channel, setChannel] = useState('SMS');
  const [isSending, setIsSending] = useState(false);

  const handleSendAlert = async (e) => {
    e.preventDefault();
    if (!message || !recipient) return;

    setIsSending(true);
    await onTriggerManualAlert({
      risk_level: 'CRITICAL',
      risk_score: 95.0,
      channel,
      recipient,
      message
    });
    setIsSending(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '100%', padding: '24px', overflowY: 'auto' }}>
      
      {/* Live Dispatched Alerts Stream */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <ShieldAlert size={22} color="#ef4444" />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
            Dispatched Emergency Warning Logs
          </h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              No emergency alerts issued yet.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="glass-panel"
                style={{ padding: '14px', borderColor: alert.risk_level === 'CRITICAL' ? 'rgba(239,68,68,0.4)' : 'var(--border-light)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className={`badge badge-${alert.risk_level?.toLowerCase()}`}>
                    {alert.risk_level} ALERT
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {new Date(alert.sent_at).toLocaleTimeString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '8px', lineHeight: '1.4' }}>
                  {alert.message}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Channel: <strong style={{ color: '#818cf8' }}>{alert.channel}</strong> ({alert.recipient})</span>
                  <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} /> Dispatched
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Manual Disaster Control Room Override Form */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Radio size={22} color="#f97316" />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
            Disaster Control Room Alert Override
          </h2>
        </div>

        <form onSubmit={handleSendAlert} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Multi-Channel Dispatch Gateway
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.85rem'
              }}
            >
              <option value="SMS">SMS Emergency Broadcast (Twilio Gateway)</option>
              <option value="WHATSAPP">WhatsApp Disaster Hotline</option>
              <option value="FCM">Firebase Push Notification (FCM Mobile App)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Recipient Phone / Group Channel
            </label>
            <input
              type="text"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Warning Message Payload
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.85rem',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="btn btn-danger"
            style={{ padding: '12px', fontSize: '0.9rem', marginTop: '8px' }}
          >
            <Send size={18} /> {isSending ? 'Transmitting Warning...' : 'Broadcast Emergency Warning'}
          </button>

        </form>
      </div>

    </div>
  );
}
