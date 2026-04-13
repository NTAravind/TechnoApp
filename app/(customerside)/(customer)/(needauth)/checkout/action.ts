'use server';
import prisma from '@/lib/prisma';

interface ActionResult {
  success: boolean;
  message: string;
  user?: any;
}

export async function createUser(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const name = formData.get('name')?.toString().trim();
    const phone = formData.get('phone')?.toString().trim();
    const email = formData.get('email')?.toString().trim() || null;
    const address = formData.get('Address')?.toString().trim() || null;
    const pincode = formData.get('pincode')?.toString().trim() || null;
    const delivered = formData.get('delivered') === 'true';

    // Required field validation
    if (!name || !phone) {
      return {
        success: false,
        message: 'Name and phone number are required',
      };
    }

    if (delivered && (!address || !pincode)) {
      return {
        success: false,
        message: 'Address and pincode are required for delivery orders',
      };
    }

    // Phone number validation (10 digits, numeric only)
    if (!/^\d{10}$/.test(phone)) {
      return {
        success: false,
        message: 'Please enter a valid 10-digit phone number',
      };
    }

    // Name validation (letters and spaces, 2-50 characters)
    if (!/^[A-Za-z\s]{2,50}$/.test(name)) {
      return {
        success: false,
        message: 'Name must be 2-50 characters and contain only letters and spaces',
      };
    }

    // Email validation (if provided)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        success: false,
        message: 'Please enter a valid email address',
      };
    }

    // Address validation (if provided or required for delivery)
    if (address && !/^[A-Za-z0-9\s,.-]{5,100}$/.test(address)) {
      return {
        success: false,
        message: 'Address must be 5-100 characters and can include letters, numbers, spaces, commas, periods, and hyphens',
      };
    }

    // Pincode validation (if provided or required for delivery)
    if (pincode && !/^\d{6}$/.test(pincode)) {
      return {
        success: false,
        message: 'Pincode must be a 6-digit number',
      };
    }

    const userData = {
      name,
      phone,
      email,
      Address: address || '',
      pincode: pincode || '',
    };

    const user = await prisma.customer.create({
      data: userData,
    });

    return {
      success: true,
      message: `Customer details saved successfully for ${delivered ? 'delivery' : 'pickup'} order`,
      user,
    };
  } catch (error: any) {
    console.error('Error creating customer:', {
      error: error.message,
      code: error.code,
      meta: error.meta,
    });

    // Handle duplicate phone number or email error
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      if (target?.includes('phone')) {
        return {
          success: false,
          message: 'A customer with this phone number already exists. Try updating instead.',
        };
      }
      if (target?.includes('email')) {
        return {
          success: false,
          message: 'This email address is already in use by another customer.',
        };
      }
    }

    return {
      success: false,
      message: 'Failed to save customer details. Please try again later.',
    };
  }
}

export async function updateUser(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const name = formData.get('name')?.toString().trim();
    const phone = formData.get('phone')?.toString().trim();
    const email = formData.get('email')?.toString().trim() || null;
    const address = formData.get('Address')?.toString().trim() || null;
    const pincode = formData.get('pincode')?.toString().trim() || null;
    const delivered = formData.get('delivered') === 'true';

    // Required field validation
    if (!name || !phone) {
      return {
        success: false,
        message: 'Name and phone number are required',
      };
    }

    if (delivered && (!address || !pincode)) {
      return {
        success: false,
        message: 'Address and pincode are required for delivery orders',
      };
    }

    // Phone number validation (10 digits, numeric only)
    if (!/^\d{10}$/.test(phone)) {
      return {
        success: false,
        message: 'Please enter a valid 10-digit phone number',
      };
    }

    // Name validation (letters and spaces, 2-50 characters)
    if (!/^[A-Za-z\s]{2,50}$/.test(name)) {
      return {
        success: false,
        message: 'Name must be 2-50 characters and contain only letters and spaces',
      };
    }

    // Email validation (if provided)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        success: false,
        message: 'Please enter a valid email address',
      };
    }

    // Address validation (if provided or required for delivery)
    if (address && !/^[A-Za-z0-9\s,.-]{5,100}$/.test(address)) {
      return {
        success: false,
        message: 'Address must be 5-100 characters and can include letters, numbers, spaces, commas, periods, and hyphens',
      };
    }

    // Pincode validation (if provided or required for delivery)
    if (pincode && !/^\d{6}$/.test(pincode)) {
      return {
        success: false,
        message: 'Pincode must be a 6-digit number',
      };
    }

    const updateData = {
      name,
      email,
      Address: address || '',
      pincode: pincode || '',
    };

    const user = await prisma.customer.update({
      where: { phone },
      data: updateData,
    });

    return {
      success: true,
      message: `Customer details updated successfully for ${delivered ? 'delivery' : 'pickup'} order`,
      user,
    };
  } catch (error: any) {
    console.error('Error updating customer:', {
      error: error.message,
      code: error.code,
      meta: error.meta,
    });

    // Handle case where customer doesn't exist
    if (error.code === 'P2025') {
      return {
        success: false,
        message: 'Customer not found. Please create a new account.',
      };
    }

    // Handle duplicate email error
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return {
        success: false,
        message: 'This email address is already in use by another customer.',
      };
    }

    return {
      success: false,
      message: 'Failed to update customer details. Please try again later.',
    };
  }
}