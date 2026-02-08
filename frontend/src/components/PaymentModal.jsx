import { X, CreditCard } from 'lucide-react';
import './PaymentModal.css';

export default function PaymentModal({ course, onClose, onPaymentSuccess }) {
  const handlePayment = () => {
    // Simulate payment processing
    alert(`Payment of $${course.price} for "${course.title}" is being processed...`);
    
    // In a real app, integrate with payment gateway here
    setTimeout(() => {
      alert('✅ Payment successful! You can now access the course.');
      onPaymentSuccess();
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="payment-header">
          <CreditCard size={48} color="#3b82f6" />
          <h2>Complete Your Purchase</h2>
        </div>

        <div className="course-summary">
          <h3>{course.title}</h3>
          <p className="course-instructor">by {course.instructor_name}</p>
          <div className="price-display">
            <span className="price-label">Total Amount:</span>
            <span className="price-amount">${course.price}</span>
          </div>
        </div>

        <div className="payment-info">
          <p>🔒 Secure payment processing</p>
          <p>💳 All major credit cards accepted</p>
          <p>✅ Instant access after payment</p>
        </div>

        <div className="payment-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handlePayment}>
            Pay ${course.price}
          </button>
        </div>

        <p className="payment-note">
          Note: This is a demo. No actual payment will be processed.
        </p>
      </div>
    </div>
  );
}
