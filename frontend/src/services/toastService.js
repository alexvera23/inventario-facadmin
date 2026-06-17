import toast from 'react-hot-toast';

export const toastService = {
  success(message) {
    toast.success(message);
  },

  error(message) {
    toast.error(message);
  },

  info(message) {
    toast(message);
  },

  loading(message) {
    return toast.loading(message);
  },

  dismiss(id) {
    toast.dismiss(id);
  },
};