import { toast } from '../components/ToastProvider';

export const toastService = {
  success: toast.success,
  error: toast.error,
  warning: toast.warning,
  info: toast.info,
  loading: toast.loading,
  dismiss: toast.dismiss,
  promise: toast.promise,
};